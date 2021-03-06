/*
 import chai = require('chai');
 import restify = require('restify');
 import sinon = require('sinon');
 var http = require('http');
 */

/**
 * Created by rtholmes on 2016-08-17.
 */


// import MemoryStore from '../src/controller/GitHubManager';
import Log from "../src/Util";
import GithubProjectController from "../src/batch/GitHubManager";

var expect = require('chai').expect;


describe("GitHubManager", function () {

    var controller: GithubProjectController;

    let REPO_NAME1 = 'MochaTestRepo1';// 'cpsc310project_forAutoTest';
    let TEAM_NAME1 = 'MochaTestTeam1';

    let REPO_NAME2 = 'cpsc310project_rtholmes'; // MochaTestRepo2 // cpsc310project_rtholmes
    let TEAM_NAME2 = 'cpsc310project_rtholmes';

    // organization name
    // const ORG_NAME = "CS410-2015Fall";
    // const ORG_NAME = "CS310-2016Fall";
    const ORG_NAME = "CS310-2017Jan";

    beforeEach(function () {
        controller = new GithubProjectController(ORG_NAME);
    });

    // no assertions because we don't really care about repo deletion
    xit("Should be able to delete a repo", function () {
        return controller.deleteRepo(REPO_NAME1).then(function (res) {
            Log.test('Repo deleted: ' + res);
            // expect(res).not.to.be.null;
        }).catch(function (err) {
            Log.test('Did not delete repo: ' + err);
            // expect(true).to.be.false; // should not happen
        });

    });

    // works the first time (if the project doesn't exist)
    xit("Should be able to create a repo", function () {
        return controller.createRepo(REPO_NAME1).then(function (res) {
            Log.test('Repo created: ' + res);
            expect(res).not.to.be.null;
        }).catch(function (err) {
            Log.test('Did not create repo: ' + err);
            expect(true).to.be.false; // should not happen
        });
    });

    /*
     // no assertions because we don't really care about repo deletion
     it("Should be able to delete a team", function () {
     return controller.deleteTeam(TEAM_NAME1).then(function (res) {
     Log.test('Team deleted: ' + res);
     expect(res).not.to.be.null;
     }).catch(function (err) {
     Log.test('Did not delete team: ' + err);
     expect(true).to.be.false; // should not happen
     });
     });
     */

    xit("Should be able to create a team", function () {
        return controller.createTeam(TEAM_NAME1, 'push').then(function (res) {
            Log.test('Team created: ' + res);
            expect(res).not.to.be.null;
        }).catch(function (err) {
            Log.test('Did not create team: ' + err);
            expect(true).to.be.false; // should not happen
        });
    });

    xit("Should be able to list the teams", function () {
        return controller.listTeams().then(function (res) {
            Log.test('Team list: ' + res);
            expect(res).not.to.be.null;
        }).catch(function (err) {
            Log.test('Did not list team: ' + err);
            expect(true).to.be.false; // should not happen
        });
    });

    xit("Should be able to add a team to a repo", function () {
        let teamId = 2100162;
        return controller.addTeamToRepo(teamId, REPO_NAME1, 'admin').then(function (res) {
            Log.test('Team added to repo: ' + res);
            expect(res).not.to.be.null;
        }).catch(function (err) {
            Log.test('Did not add team to repo: ' + err);
            expect(true).to.be.false; // should not happen
        });
    });

    xit("Should be able to add members to a team", function () {
        let teamId = 2100162;
        let members = ['rtholmes', 'rthse2'];
        return controller.addMembersToTeam(teamId, members).then(function (res) {
            Log.test('Members added to team: ' + JSON.stringify(res));
            expect(res).not.to.be.null;
        }).catch(function (err: any) {
            Log.test('Did not add members to team: ' + err);
            expect(true).to.be.false; // should not happen
        });
    });


    /**
     * Works:
     *
     * Make sure the team and repo do not already exist.
     */
    xit("Should be able to configure a complete repo and team with membership", function () {
        this.timeout(5000);

        // let teamId = 2100162;
        let members = ['rtholmes', 'rthse2'];

        let outerTeamId = -1;

        // create repo
        return controller.createRepo(REPO_NAME2).then(function (res) {
            Log.test('Repo created: ' + res);
            expect(res).not.to.be.null;

            // create team
            return controller.createTeam(TEAM_NAME2, 'push');
        }).then(function (teamId: number) {
            Log.test('Team created: ' + teamId);
            outerTeamId = teamId;

            // add members to team
            return controller.addMembersToTeam(teamId, members);
        }).then(function (res: any) {
            Log.test('Members added to team: ' + JSON.stringify(res));

            // add team to repo
            return controller.addTeamToRepo(outerTeamId, REPO_NAME2, 'admin');
        }).then(function (res: any) {
            Log.test('Team added to repo: ' + res);

            Log.test('Team, Repo, and Membership configured for: ' + REPO_NAME2);
            expect(true).to.be.true;
        }).catch(function (err) {
            Log.test('Something went wrong: ' + err);
            expect(true).to.be.false; // should not happen
        });

    });

    xit("Should be able to import a repo", function () {
        let targetRepo = REPO_NAME2;
        let importUrl = 'https://github.com/CS310-2016Fall/cpsc310project';

        return controller.importRepoToNewRepo(targetRepo, importUrl).then(function (res) {
            Log.test('Repo imported: ' + JSON.stringify(res));
            expect(res).not.to.be.null;
            return controller.checkImportProgress(targetRepo);
        }).then(function (retVal) {
            Log.test('Repo import status: ' + JSON.stringify(retVal));
            expect(retVal).not.to.be.null;
        }).catch(function (err: any) {
            Log.test('Repo NOT imported: ' + err);
            expect(true).to.be.false; // should not happen
        });
    });

    xit("Should be able to update import status", function () {
        let targetRepo = REPO_NAME1;

        return controller.updateImport(targetRepo).then(function (retVal) {
            Log.test('Repo import update: ' + JSON.stringify(retVal));
            expect(retVal).not.to.be.null;
        }).catch(function (err: any) {
            Log.test('Repo import update problem: ' + err);
            expect(true).to.be.false; // should not happen
        });
    });

    xit("Should be able to check repo import status", function () {
        let targetRepo = REPO_NAME1;

        return controller.checkImportProgress(targetRepo).then(function (retVal) {
            Log.test('Repo import status: ' + JSON.stringify(retVal));
            expect(retVal).not.to.be.null;
        }).catch(function (err: any) {
            Log.test('Repo import status problem: ' + err);
            expect(true).to.be.false; // should not happen
        });
    });

    it("Should be able to add webhook to repo", function () {
        let targetRepo = REPO_NAME2;

        let webhookURL = 'http://localhost:1234/';
        return controller.addWebhook(targetRepo, webhookURL).then(function (retVal) {
            Log.test('Repo hook status: ' + JSON.stringify(retVal));
            expect(retVal).not.to.be.null;
        }).catch(function (err: any) {
            Log.test('Repo hook status problem: ' + err);
            expect(true).to.be.false; // should not happen
        });
    });

});