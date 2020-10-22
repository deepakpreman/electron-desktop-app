import { DbClass } from './db-class';

/**
 * Simple class for selecting, inserting, updating and deleting users in user table.
 *
 * @export
 * @class User
 */
export class User {
    public id = -1;
    public name = '';

    public static get(id: number): Promise<User> {
        const sql = 'SELECT * FROM user WHERE id = $id';
        const values = { $id: id };

        return DbClass.selectOne(sql, values)
            .then((row) => {
                if (row) {
                    return new User().fromRow(row);
                } else {
                    throw new Error('Expected to find 1 User. Found 0.');
                }
            });
    }

    public static getAll(): Promise<User[]> {
        const sql = `SELECT * FROM user ORDER BY name`;
        const values = {};

        return DbClass.selectAll(sql, values)
            .then((rows) => {
                const users: User[] = [];
                for (const row of rows) {
                    const user = new User().fromRow(row);
                    users.push(user);
                }
                return users;
            });
    }

    public insert(): Promise<void> {
        const sql = `
            INSERT INTO user (name)
            VALUES($name)`;

        const values = {
            $name: this.name,
        };

        return DbClass.insert(sql, values)
            .then((result) => {
                if (result.changes !== 1) {
                    throw new Error(`Expected 1 User to be inserted. Was ${result.changes}`);
                } else {
                    this.id = result.lastID;
                }
            });
    }

    public update(): Promise<void> {
        const sql = `
            UPDATE user
               SET name = $name
             WHERE id = $id`;

        const values = {
            $name: this.name,
        };

        return DbClass.update(sql, values)
            .then((result) => {
                if (result.changes !== 1) {
                    throw new Error(`Expected 1 User to be updated. Was ${result.changes}`);
                }
            });
    }

    public delete(): Promise<void> {
        const sql = `
            DELETE FROM user WHERE id = $id`;

        const values = {
            $id: this.id,
        };

        return DbClass.delete(sql, values)
            .then((result) => {
                if (result.changes !== 1) {
                    throw new Error(`Expected 1 User to be deleted. Was ${result.changes}`);
                }
            });
    }

    public fromRow(row: object): User {
        this.id = row['id'];
        this.name = row['name'];

        return this;
    }
}
