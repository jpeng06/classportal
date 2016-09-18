/**
 * Created by rtholmes on 2016-06-19.
 */

import Log from "../Util";
var request = require('request');
var config = require('../../config.json');

var rp = require('request-promise-native');


/**
 * Represents a complete team that has been formed and where all members
 * are already registered (so we have their Github ids).
 */
interface GroupRepoDescription {
    team: number;
    members: string[]; // github usernames
    teamNumber?: number; // internal Github teamid
}

export default class GithubProjectController {

    // TODO: use external config file; these shouldn't be in github
    private GITHUB_AUTH_TOKEN = config.githubcontroller_token;
    private GITHUB_USER_NAME = config.githubcontroller_user;
    // bruce
    // private GITHUB_AUTH_TOKEN = 'token 8c017236d0429fe33d8aed1ea435e6777aaeab88';
    // private GITHUB_USER_NAME = 'zhihaoli';

    // private ORG_NAME = "CS410-2015Fall";
    private ORG_NAME = "CS310-2016Fall";

    /**
     * Creates a given repo and returns its url. Will fail if the repo already exists.
     *
     * @param repoName
     * @returns {Promise<T>}
     */
    public createRepo(repoName: string): Promise<string> {
        let ctx = this;

        Log.info("GithubProjectController::createRepo(..) - start");
        return new Promise(function (fulfill, reject) {

            var options = {
                method: 'POST',
                uri: 'https://api.github.com/orgs/' + ctx.ORG_NAME + '/repos',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME,
                    'Accept': 'application/json'
                },
                body: {
                    name: repoName,
                    private: true,
                    has_issues: true,
                    has_wiki: false,
                    has_downloads: false,
                    auto_init: false
                },
                json: true
            };

            rp(options).then(function (body: any) {
                let url = body.html_url;
                Log.info("GithubProjectController::createRepo(..) - success; url: " + url);
                fulfill(url);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::createRepo(..) - ERROR: " + JSON.stringify(err));
                reject(err);
            });

        });
    }

    /**
     * Deletes a repo from the organization.
     *
     * @param repoName
     * @returns {Promise<T>}
     */
    public deleteRepo(repoName: string): Promise<string> {
        let ctx = this;

        Log.info("GithubProjectController::deleteRepo(..) - start");
        return new Promise(function (fulfill, reject) {

            var options = {
                method: 'DELETE',
                uri: 'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + repoName,
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME,
                    'Accept': 'application/json'
                }
            };

            rp(options).then(function (body: any) {
                Log.info("GithubProjectController::deleteRepo(..) - success; body: " + body);
                fulfill(body);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::deleteRepo(..) - ERROR: " + JSON.stringify(err));
                reject(err);
            });

        });
    }

    /**
     * Lists teams. Will fail if more than 200 teams are in the organization
     * (or Github starts to disallow forcing the per_page variable).
     *
     * The success callback will include the Github team objects.
     *
     * @param teamName
     * @returns {Promise<T>}
     */
    public listTeams(): Promise<{}> {
        let ctx = this;

        Log.info("GithubProjectController::listTeams(..) - start");
        return new Promise(function (fulfill, reject) {

            var options = {
                method: 'GET',
                uri: 'https://api.github.com/orgs/' + ctx.ORG_NAME + '/teams?per_page=200',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME,
                    'Accept': 'application/json'
                },
                resolveWithFullResponse: true,
                json: true
            };

            rp(options).then(function (fullResponse: any) {

                if (typeof fullResponse.headers.link !== 'undefined') {
                    let eMessage = "GithubProjectController::listTeams(..) - ERROR; pagination encountered (and not handled)";
                    Log.error(eMessage);
                    reject(eMessage);
                }

                let teams: any = [];
                // Log.trace("GithubProjectController::creatlistTeams(..) - success: " + JSON.stringify(fullResponse.body));
                for (var team of fullResponse.body) {
                    let id = team.id;
                    let name = team.name;

                    Log.info("GithubProjectController::listTeams(..) - team: " + JSON.stringify(team));
                    teams.push({id: id, name: name});
                }

                fulfill(teams);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::listTeams(..) - ERROR: " + err);
                reject(err);
            });
        });
    }

    /**
     * Creates a team for a groupName (e.g., cpsc310_team1).
     *
     * Returns the teamId (used by many other Github calls).
     *
     * @param teamName
     * @returns {Promise<T>}
     */
    public createTeam(teamName: string): Promise<number> {
        let ctx = this;

        Log.info("GithubProjectController::createTeam(..) - start");
        return new Promise(function (fulfill, reject) {

            var options = {
                method: 'POST',
                uri: 'https://api.github.com/orgs/' + ctx.ORG_NAME + '/teams',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME,
                    'Accept': 'application/json'
                },
                body: {
                    name: teamName
                },
                json: true
            };

            rp(options).then(function (body: any) {
                let id = body.id;
                Log.info("GithubProjectController::createTeam(..) - success: " + id);
                fulfill(id);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::createTeam(..) - ERROR: " + err);
                reject(err);
            });
        });
    }

    /**
     * NOTE: needs the team Id (number), not the team name (string)!
     *
     * @param teamId
     * @param repoName
     * @param permission ('pull', 'push', 'admin')
     * @returns {Promise<T>}
     */
    public addTeamToRepo(teamId: number, repoName: string, permission: string) {
        let ctx = this;
        Log.info("GithubProjectController::addTeamToRepo( " + teamId + ", " + repoName + " ) - start");
        return new Promise(function (fulfill, reject) {

            var options = {
                method: 'PUT',
                uri: 'https://api.github.com/teams/' + teamId + '/repos/' + ctx.ORG_NAME + '/' + repoName,
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME,
                    'Accept': 'application/json'
                },
                body: {
                    permission: permission
                },
                json: true
            };

            rp(options).then(function (body: any) {
                Log.info("GithubProjectController::addTeamToRepo(..) - success: " + body);
                // onSuccess(body);
                fulfill(body);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::addTeamToRepo(..) - ERROR: " + err);
                reject(err);
            });
        });
    }

    /**
     * Add a set of Github members (their usernames) to a given team.
     *
     * @param teamId
     * @param members
     * @returns {Promise<T>}
     */
    public addMembersToTeam(teamId: number, members: string[]): Promise<{}> {
        let ctx = this;
        Log.info("GithubProjectController::addMembersToTeam(..) - start");

        return new Promise(function (fulfill, reject) {
            let promises: any = [];
            for (var member of members) {
                Log.info("GithubProjectController::addMembersToTeam(..) - adding member: " + member);

                let opts = {
                    method: 'PUT',
                    uri: 'https://api.github.com/teams/' + teamId + '/memberships/' + member,
                    headers: {
                        'Authorization': ctx.GITHUB_AUTH_TOKEN,
                        'User-Agent': ctx.GITHUB_USER_NAME,
                        'Accept': 'application/json'
                    },
                    json: true
                };
                promises.push(rp(opts));
            }

            Promise.all(promises).then(function (results: any) {
                Log.info("GithubProjectController::addMembersToTeam(..) - success: " + results);
                fulfill(results);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::addMembersToTeam(..) - ERROR: " + err);
                reject(err);
            });
        });
    }

    /**
     *
     *
     * @param targetRepo
     * @param importRepoUrl
     * @returns {Promise<T>}
     */
    public importRepoToNewRepo(targetRepo: string, importRepoUrl: string): Promise<{}> {
        let ctx = this;
        Log.info("GithubProjectController::importRepoToNewRepo(..) - start");

        return new Promise(function (fulfill, reject) {

            // PUT /repos/:owner/:repo/import
            let opts = {
                method: 'PUT',
                uri: 'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + targetRepo + '/import',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME,
                    'Accept': 'application/vnd.github.barred-rock-preview'
                },
                body: {
                    vcs_url: importRepoUrl
                },
                json: true
            };

            rp(opts).then(function (results: any) {
                Log.info("GithubProjectController::importRepoToNewRepo(..) - success: " + results);
                fulfill(results);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::importRepoToNewRepo(..) - ERROR: " + err);
                reject(err);
            });
        });
    }

    public checkImportProgress(repoName: string): Promise<{}> {
        let ctx = this;
        Log.info("GithubProjectController::checkImportProgress(..) - start");

        return new Promise(function (fulfill, reject) {

            // GET /repos/:owner/:repo/import
            let opts = {
                method: 'GET',
                uri: 'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + repoName + '/import',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME,
                    'Accept': 'application/vnd.github.barred-rock-preview'
                },
                json: true
            };

            rp(opts).then(function (results: any) {
                Log.info("GithubProjectController::checkImportProgress(..) - success: " + results);
                fulfill(results);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::checkImportProgress(..) - ERROR: " + err);
                reject(err);
            });
        });
    }

    /**
     * Used to provide updated credentials for an import.
     *
     * @param repoName
     * @returns {Promise<T>}
     */
    public updateImport(repoName: string): Promise<{}> {
        let ctx = this;
        Log.info("GithubProjectController::updateImport(..) - start");

        return new Promise(function (fulfill, reject) {

            // PATCH /repos/:owner/:repo/import
            let opts = {
                method: 'PATCH',
                uri: 'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + repoName + '/import',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME,
                    'Accept': 'application/vnd.github.barred-rock-preview'
                },
                body: {
                    "vcs_username": "foo",
                    "vcs_password": "bar"
                },
                json: true
            };

            rp(opts).then(function (results: any) {
                Log.info("GithubProjectController::updateImport(..) - success: " + results);
                fulfill(results);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::updateImport(..) - ERROR: " + err);
                reject(err);
            });
        });
    }

    public addWebhook(repoName: string): Promise<{}> {
        let ctx = this;
        Log.info("GithubProjectController::addWebhook(..) - start");

        return new Promise(function (fulfill, reject) {

            // POST /repos/:owner/:repo/hooks
            let opts = {
                method: 'POST',
                uri: 'https://api.github.com/repos/' + ctx.ORG_NAME + '/' + repoName + '/hooks',
                headers: {
                    'Authorization': ctx.GITHUB_AUTH_TOKEN,
                    'User-Agent': ctx.GITHUB_USER_NAME
                },
                body: {
                    "name": "web",
                    "active": true,
                    "events": ["commit_comment"],
                    "config": {
                        "url": "http://skaha.cs.ubc.ca:8080/submit",
                        "content_type": "json"
                    }
                },
                json: true
            };

            rp(opts).then(function (results: any) {
                Log.info("GithubProjectController::addWebhook(..) - success: " + results);
                fulfill(results);
            }).catch(function (err: any) {
                Log.error("GithubProjectController::addWebhook(..) - ERROR: " + err);
                reject(err);
            });
        });
    }


    public createAllRepos(repoNames: string[]): Promise<any[]> {
        let ctx = this;
        Log.info("GithubProjectController::createAllRepos(..) - start");

        let promises: Promise<any>[] = [];

        for (var repoName of repoNames) {

            Log.trace("GithubProjectController::createAllRepos(..) - pushing: " + repoName);
            promises.push(ctx.createRepo(repoName));
        }
        Log.info("GithubProjectController::createAllRepos(..) - all pushed");

        return Promise.all(promises);
    }

    public importAllRepos(repoNames: string[], importRepoUrl: string): Promise<any[]> {
        Log.info("GithubProjectController::importAllRepos(..) - start");

        let promises: Promise<any>[] = [];
        for (var repoName of repoNames) {
            Log.trace("GithubProjectController::importAllRepos(..) - pushing: " + repoName);
            promises.push(this.importRepoToNewRepo(repoName, importRepoUrl));
        }
        Log.info("GithubProjectController::importAllRepos(..) - all pushed");

        return Promise.all(promises);
    }

    public addTeamToRepos(repoNames: string[], adminTeamName: string, permissions: string) {
        Log.info("GithubProjectController::addTeamToRepos(..) - start");
        let ctx = this;

        return new Promise(function (fulfill, reject) {
            let teamId = -1;
            ctx.listTeams().then(function (teamList: any) {
                Log.info("GithubProjectController::addTeamToRepos(..) - all teams: " + JSON.stringify(teamList));
                for (var team of teamList) {
                    if (team.name === adminTeamName) {
                        teamId = team.id;
                        Log.info("GithubProjectController::addTeamToRepos(..) - matched admin team; id: " + teamId);
                    }
                }
                if (teamId < 0) {
                    throw new Error('Could not find team called: ' + adminTeamName);
                }
                let promises: Promise<any>[] = [];

                for (var repoName of repoNames) {
                    promises.push(ctx.addTeamToRepo(teamId, repoName, permissions));
                }
                Log.info("GithubProjectController::addTeamToRepos(..) - all addTeams pushed");

                Promise.all(promises).then(function (allDone) {
                    Log.info("GithubProjectController::addTeamToRepos(..) - all done; final: " + JSON.stringify(allDone));
                    // Promise.resolve(allDone);
                    fulfill(allDone);
                }).catch(function (err) {
                    Log.info("GithubProjectController::addTeamToRepos(..) - all done ERROR: " + err);
                    // Promise.reject(err);
                    reject(err);
                });

                //}).then(function (res: any) {
                //    Log.info("GithubProjectController::addTeamToRepos(..) - done; team added to all repos: " + JSON.stringify(res));
                //    fulfill(res);
            }).catch(function (err: any) {
                Log.info("GithubProjectController::addTeamToRepos(..) - ERROR: " + err);
                reject(err);
            });

            Log.info("GithubProjectController::addTeamToRepos(..) - end");
        });
    }

} // end class

var gpc = new GithubProjectController();

let repoList: string[] = [];
for (var i = 0; i < 3; i++) {
    repoList.push('cpsc310test_team' + i);
}
/*
 // create the repos
 gpc.createAllRepos(repoList).then(function (res) {
 Log.info('All repos created: ' + JSON.stringify(res));
 }).catch(function (err) {
 Log.error('Error creating repos: ' + JSON.stringify(err));
 });

 let importUrl = 'https://github.com/CS310-2016Fall/cpsc310project';
 gpc.importAllRepos(repoList, importUrl).then(function (res) {
 Log.info('All repos importing: ' + JSON.stringify(res));
 }).catch(function (err) {
 Log.error('Error importing repos: ' + JSON.stringify(err));
 });
 */

gpc.addTeamToRepos(repoList, '310Staff', 'admin').then(function (res) {
    Log.info('Adding team to repos success: ' + JSON.stringify(res));
}).catch(function (err) {
    Log.info('Error adding team to repos: ' + err);
});

