import { Component ,OnInit} from '@angular/core';
import * as fs from 'fs';
import * as path from 'path';
import { RestService } from  '../services/rest.service';
import { first } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';

// tslint:disable-next-line:no-implicit-dependencies
import { Menu, MenuItemConstructorOptions, OpenDialogOptions, remote, OpenDialogSyncOptions, SaveDialogSyncOptions } from 'electron';

import { User } from '../model/user';
import { Settings } from '../model/settings';
import { DbClass } from '../model/db-class';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  // userList: User[];
    public users: User[];

    ngOnInit(){

    }

    constructor(private spinner: NgxSpinnerService,private restService: RestService) {
        Settings.initialize();

        if (fs.existsSync(Settings.dbPath)) {
            this.openDb(Settings.dbPath);
        } else if (Settings.hasFixedDbLocation) {
            this.createDb(Settings.dbPath);
        } else {
            this.createDb();
        }
    }

    public openDb(filename: string) {
      DbClass.openDb(filename)
            .then(() => {
                if (!Settings.hasFixedDbLocation) {
                    Settings.dbPath = filename;
                    Settings.write();
                }
            })
            .then(() => {
                this.getUsers();
            })
            .catch((reason) => {
                // Handle errors
                console.log('Error occurred while opening database: ', reason);
            });
    }

    public async createDb(filename?: string) {
        if (!filename) {
            const options: SaveDialogSyncOptions = {
                title: 'Create file',
                defaultPath: remote.app.getPath('documents'),
                filters: [
                    {
                        name: 'Database',
                        extensions: ['db'],
                    },
                ],
            };
            filename = remote.dialog.showSaveDialogSync(remote.getCurrentWindow(), options);
        }

        if (!filename) {
            return;
        }

        DbClass.createDb(filename)
            .then((dbPath) => {
                if (!Settings.hasFixedDbLocation) {
                    Settings.dbPath = dbPath;
                    Settings.write();
                }
            })
            .then(() => {
                this.getUsers();
            })
            .catch((reason) => {
                console.log(reason);
            });
    }

    public onRestoreDb() {
      DbClass.importJson(path.join(Settings.dbFolder, 'database.init.json'), false)
            .then(() => {
                this.getUsers();
            });
    }

    public getUsers() {
        User.getAll()
            .then((users) => {
                if(users.length > 1){
                    this.users = users;
                }else{
                    this.getUserFromApi();
                }
            });
    }

    public getUserFromApi(){
        this.restService.getUsers().pipe(first())
        .subscribe(
        response => {
            if(response.data.length != 0){
                for (let index = 0; index < response.data.length; index++) {
                    const element = response.data[index];
                    let user = new User();
                    user.name = element.first_name +' '+element.last_name
                    user.insert();                    
                }
                this.getUsers();
            }
            this.spinner.hide();
        },
        error => {
            this.spinner.hide();  
        });
    }

    public onMenu(user: User) {
        const menu = this.initMenu(user);
        menu.popup({});
    }

    private deleteUser(user: User) {
      user.delete();
      this.getUsers();
    }

    private initMenu(user: User): Menu {
        const template: MenuItemConstructorOptions[] = [
            {
                label: `Delete ${user.name}`,
                click: () => this.deleteUser(user),
            },
        ];

        return remote.Menu.buildFromTemplate(template);
    }
}
