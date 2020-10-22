import { User } from './user';
import { Settings } from './settings';
import { DbClass } from './db-class';

interface IGlobals {
    user: User;
    userId: number;
    name: string;
    count: number;
    newName: string;
}

describe('User', () => {
    // Using globs for sharing variables because using "this" for shared variables makes typescript compiler throw noImplicitAny errors
    const globals: IGlobals = {
        user: new User(),
        userId: 11,
        name: 'Mr. Nice',
        count: 5,
        newName: 'a silly name',
    };

    const insertUser = (): Promise<User> => {
        const user = new User();
        user.name = globals.newName;

        return user.insert()
            .then(() => {
                return user;
            });
    };

    beforeEach((done) => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 999999;

        Settings.initialize();
        DbClass.openDb(Settings.dbPath)
            .then(DbClass.resetDbKarma)
            .then(() => {
                return User.get(globals.userId);
            })
            .then((user) => {
                globals.user = user;
                done();
            })
            .catch((reason) => {
                throw reason;
            });
    });

    it('getUser()', (done) => {
        User.get(globals.userId)
            .then((user) => {
                expect(user.name).toBe(globals.name);
                done();
            });
    });

    it('getUser(-1)', (done) => {
        User.get(-1)
            .catch((reason) => {
                expect(reason).toBeDefined();
                done();
            });
    });

    it('getUsers()', (done) => {
        User.getAll()
            .then((users) => {
                expect(users.length).toBe(globals.count);
                done();
            });
    });

    it('insertUser()', (done) => {
        insertUser()
            .then((user) => {
                return User.get(user.id);
            })
            .then((insertedUser) => {
                expect(insertedUser.name).toBe(globals.newName);
                done();
            })
            .catch((reason) => {
                fail(reason);
                done();
            });
    });

    it('deleteUser()', (done) => {
        globals.user.delete()
            .then(User.getAll)
            .then((users) => {
                const index = users.findIndex((item) => item.id === globals.userId);
                expect(index).toBe(-1);
                done();
            })
            .catch((reason) => {
                expect(reason.message).toContain('Expected to get User transaction, found 0');
                done();
            });
    });
});
