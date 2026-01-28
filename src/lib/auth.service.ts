import {Injectable, signal} from "@angular/core";
import {Models} from "appwrite";
import {account, functions, functionsList, tables} from "./appwrite";
import {Key} from "./types";
import {environment} from "@environments/environment";

@Injectable({providedIn: 'root'})
export class AuthService {
    public user = signal<Models.User>({} as Models.User);
    public key = signal<Key>({} as Key)
    public isAnon = signal<boolean>(true);

    async initializeUser() {
        return account.get()
            .then(async user => {
                this.user.set(user);
                this.isAnon.set(user.email === "");
                this.key.set(await this.getKey(!this.isAnon())
                    .catch(e => {
                        if (e.code === 404) {
                            this.logout()
                        }
                        throw e;
                    })
                );
                return user;
            })
            .catch(async e => {
                if (e.code !== 401) {
                    console.error("Unexpected Error")
                    throw e;
                } else {
                    // user is not logged in yet
                    await account.createAnonymousSession();
                    this.user.set(await account.get());
                    await functions.createExecution(
                        {
                            functionId: functionsList["link_on_user_creation_anonymous"],
                            body: JSON.stringify({
                                "policy": "ors_anonymous", // todo: change to some other policy, probably switch to some heigit anon
                                "tag": "ohsome-now-client"
                            })
                        }
                    );
                    this.key.set(await this.getKey(false));
                    return this.user;
                }
            })
    }

    async getKey(isFullUser: boolean) {
        return await tables.getRow({
            databaseId: "tyk_integration",
            tableId: isFullUser ? "basic_keys" : "anonymous_keys",
            rowId: this.user()!.$id
        }) as unknown as Key;
    }

    login() {

    }

    profile() {
        window.location.replace(environment.accountFrontendUrl)
    }

    async logout() {
        await account.deleteSession({sessionId: 'current'})
        location.reload();
    }
}