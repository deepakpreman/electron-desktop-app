import * as fs from 'fs';
import * as path from 'path';

import { Database } from 'sqlite3';
import { Settings } from './settings';

export interface IDbResult {
    changes: number;
    lastID: number;
}

/**
 * dbClass is a Promise-ified wrapper around bare sqlite3 API.
 *
 * @export
 * @class dbClass
 */
export class DbClass {
    private static readonly version = 1;
    private static db: Database;

    public static selectOne(sql: string, values: {}): Promise<{}> {
        return new Promise<{}>((resolve, reject) => {
            DbClass.db.get(sql, values, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    public static selectAll(sql: string, values: {}): Promise<Array<{}>> {
        return new Promise<Array<{}>>((resolve, reject) => {
            DbClass.db.all(sql, values, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    public static insert(sql: string, values: {}): Promise<IDbResult> {
        return DbClass.change(sql, values);
    }

    public static update(sql: string, values: {}): Promise<IDbResult> {
        return DbClass.change(sql, values);
    }

    public static delete(sql: string, values: {}): Promise<IDbResult> {
        return DbClass.change(sql, values);
    }

    public static query(sql: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            DbClass.db.run(sql, {}, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    public static beginTxn(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            DbClass.db.run('BEGIN', (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    public static commitTxn(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            DbClass.db.run('COMMIT', (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    public static rollbackTxn(reason: Error): Promise<void> {
        return new Promise<void>((_resolve, reject) => {
            console.log('Rollback transaction');
            DbClass.db.run('ROLLBACK', (err) => {
                if (err) {
                    console.log(err);
                    reject(new Error('Unforeseen error occurred. Please restart the application'));
                } else {
                    reject(reason);
                }
            });
        });
    }

    public static importJson(filename: string, disableForeignKeys: boolean): Promise<void> {
        const data: { version: number, tables: { [key: string]: Array<{}> } } = JSON.parse(fs.readFileSync(filename, 'utf8'));
        const tableNames = Object.keys(data.tables);
        const deletes: Array<Promise<IDbResult>> = [];
        const inserts: Array<Promise<IDbResult>> = [];

        let foreignKeys: boolean;

        return DbClass.getPragmaForeignKeys()
            .then((value) => {
                foreignKeys = value;
                if (foreignKeys === !disableForeignKeys) {
                    return Promise.resolve();
                } else {
                    return DbClass.setPragmaForeignKeys(!disableForeignKeys);
                }
            })
            .then(DbClass.beginTxn)
            .then(() => {
                for (const table of tableNames) {
                    deletes.push(DbClass.delete(`DELETE FROM ${table}`, {}));
                }
                return Promise.all(deletes);
            })
            .then(() => {
                for (const tableName of tableNames) {
                    if (data.tables[tableName].length === 0) {
                        continue;
                    }
                    const columnNames = Object.keys(data.tables[tableName][0]);

                    for (const row of data.tables[tableName]) {
                        let sql = `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES\n`;
                        const values: Array<number | string | null> = [];
                        for (const name of columnNames) {
                            values.push(row[name]);
                        }
                        sql += `(${Array(columnNames.length + 1).join('?, ').slice(0, -2)})`;
                        inserts.push(DbClass.insert(sql, values));
                    }
                }
                return Promise.all(inserts);
            })
            .then(DbClass.commitTxn)
            .catch(DbClass.rollbackTxn)
            .then(() => {
                if (foreignKeys === !disableForeignKeys) {
                    return Promise.resolve();
                } else {
                    return DbClass.setPragmaForeignKeys(foreignKeys);
                }
            });
    }

    public static exportJson(filename: string): Promise<void> {
        const data = {
            version: DbClass.version,
            tables: {},
        };

        return DbClass.selectAll(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`, {})
            .then((rows) => {
                const selects: Array<Promise<Array<{}>>> = [];
                for (const row of rows) {
                    selects.push(
                        DbClass.selectAll(`SELECT * FROM ${row['name']}`, {})
                            .then((results) => {
                                return data.tables[row['name']] = results;
                            }),
                    );
                }
                return Promise.all(selects);
            })
            .then(() => {
                fs.writeFileSync(filename, JSON.stringify(data, undefined, 4));
            });
    }

    public static resetDbKarma(): Promise<void> {
        const fromJson = path.join(Settings.dbFolder, `karma-database.init.json`);

        return DbClass.importJson(fromJson, true);
    }

    public static createDb(dbPath: string): Promise<string> {
        dbPath += path.extname(dbPath) === '.db' ? '' : '.db';

        console.log('Creating  databae: ', dbPath);

        const dataPath = path.join(Settings.dbFolder, `database.init.json`);
        const schemaPath = path.join(Settings.dbFolder, `database.db.sql`);
        const schema = fs.readFileSync(schemaPath, { encoding: 'utf8' });

        // Create data directory in userdata folder
        if (!fs.existsSync(path.join(dbPath, '..'))) {
            fs.mkdirSync(path.join(dbPath, '..'));
        }

        return DbClass.getDb(dbPath)
            .then(() => DbClass.exec(schema))
            .then(() => DbClass.setPragmaForeignKeys(true))
            .then(() => DbClass.importJson(dataPath, false))
            .then(DbClass.setPragmaVersion)
            .then(() => {
                console.log('Database created.');
                return dbPath;
            });
    }

    public static openDb(dbPath: string): Promise<void> {
        console.log('Opening database: ', dbPath);
        return DbClass.getDb(dbPath)
            .then(() => DbClass.setPragmaForeignKeys(true))
            .then(DbClass.upgradeDb)
            .then(() => {
                console.log('Database opened');
                return Promise.resolve();
            });
    }

    public static closeDb(): Promise<void> {
        if (!DbClass.db) {
            return Promise.resolve();
        }
        return new Promise<void>((resolve, reject) => {
            DbClass.db.close((err) => {
                console.log('Closing current Db');
                if (err) {
                    reject(err);
                    console.log('Db not closed');
                } else {
                    resolve();
                }
            });
        });
    }

    private static getDb(dbPath: string): Promise<void> {
        return DbClass.closeDb()
            .then(() => {
                return new Promise<void>((resolve, reject) => {
                    const db = new Database(dbPath, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            DbClass.db = db;
                            resolve();
                        }
                    });
                });
            });
    }

    private static upgradeDb(): Promise<void> {
        return DbClass.getPragmaVersion()
            .then((version) => {
                if (version === DbClass.version) {
                    return Promise.resolve();
                } else if (version > DbClass.version) {
                    throw new Error(`Cannot downgrade database from version ${version} to ${DbClass.version}.`);
                } else {
                    return new Promise<void>((resolve, reject) => {
                        switch (version) {
                            case 0:
                                // Upgrade schema if needed
                                // Upgrade data if needed
                                break;
                            default:
                                reject(new Error(`No upgrade defined for database version ${version}`));
                        }
                        resolve();
                    });
                }
            })
            .then(DbClass.setPragmaVersion);

    }

    private static change(sql: string, values: {}): Promise<IDbResult> {
        return new Promise<IDbResult>((resolve, reject) => {
            DbClass.db.run(sql, values, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes, lastID: this.lastID });
                }
            });
        });
    }

    private static exec(sql: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            DbClass.db.exec(sql, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    private static getPragmaForeignKeys(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            DbClass.db.get('PRAGMA foreign_keys', (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(Boolean(row['foreign_keys']));
                }
            });
        });
    }

    private static setPragmaForeignKeys(value: boolean): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            DbClass.db.run(`PRAGMA foreign_keys = ${value}`, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`PRAGMA foreign_keys = ${value}`);
                    resolve();
                }
            });
        });
    }

    private static getPragmaVersion(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            DbClass.db.get('PRAGMA user_version', (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(Number(row['user_version']));
                }
            });
        });
    }

    private static setPragmaVersion(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            DbClass.db.run(`PRAGMA user_version = ${DbClass.version}`, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`PRAGMA version = ${DbClass.version}`);
                    resolve();
                }
            });
        });
    }
}
