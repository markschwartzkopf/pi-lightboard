'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const global_1 = require("./global");
const uuid_1 = require("uuid");
class Group extends events_1.EventEmitter {
    constructor(id) {
        super();
        this.members = [];
        this.excludes = [];
        this.fixtures = [];
        this.dmx = false;
        this.adHoc = true;
        if (id) {
            this.id = id;
        }
        else
            this.id = uuid_1.v4();
    }
    contains(fader) {
        if (fader.type == 'empty')
            return false;
        let idList = this._getIdListByType(fader.type);
        let faderId = '';
        switch (fader.type) {
            case 'dmx':
                faderId = fader.channel.toString();
                break;
            case 'fixture':
                faderId = fader.fixture.id;
                break;
            case 'group':
                faderId = fader.group.id;
                break;
        }
        if (idList.indexOf(faderId) == -1) {
            return false;
        }
        else
            return true;
    }
    addMember(newMember) {
        switch (newMember.type) {
            case 'dmx':
                if ((this.members.length > 0 && !this.dmx) || !this.adHoc) {
                    console.error('Cannot add DMX member to non-DMX group');
                }
                else {
                    let alreadyIn = this.members.some((x) => {
                        let y = x;
                        return y.channel == newMember.channel;
                    });
                    if (!alreadyIn) {
                        this.members.push(newMember);
                    }
                    else {
                        console.warn('Tried to re-add existing DMX into group');
                    }
                    if (!this.dmx) {
                        global_1.dmx.on('change', (changes) => {
                            //
                            //code this
                            //
                        });
                        this.dmx = true;
                    }
                }
                break;
            case 'fixture':
                if (this.dmx) {
                    console.error('Cannot add fixture to DMX group');
                }
                else {
                    let alreadyIn = this.fixtures.some((x) => {
                        return x.id == newMember.fixture.id;
                    });
                    if (!alreadyIn) {
                        this.members.push(newMember);
                        this.fixtures.push(newMember.fixture);
                        newMember.fixture.on('change', (changes) => {
                            //
                            //code this
                            //
                        });
                    }
                    else {
                        console.warn('Tried to re-add existing fixture into group');
                    }
                }
                break;
            case 'group':
                console.error('Code adding groups to groups');
                //check for loops
                break;
        }
    }
    _getIdListByType(type) {
        let idList = [];
        for (let x = 0; x < this.members.length; x++) {
            let member = this.members[x];
            if (member.type == type) {
                switch (member.type) {
                    case 'dmx':
                        idList.push(member.channel.toString());
                        break;
                    case 'fixture':
                        idList.push(member.fixture.id);
                        break;
                    case 'group':
                        idList.push(member.group.id);
                        break;
                }
            }
            else
                idList.push('');
        }
        return idList;
    }
    removeMember(member) {
        let idList = this._getIdListByType(member.type);
        let memberId = '';
        switch (member.type) {
            case 'dmx':
                memberId = member.channel.toString();
                break;
            case 'fixture':
                memberId = member.fixture.id;
                break;
            case 'group':
                memberId = member.group.id;
                break;
        }
        let index = idList.indexOf(memberId);
        if (index > -1) {
            this.members.splice(index, 1);
            //
            //Unsubscribe to changes
            //
        }
        else
            console.warn('Tried to remove already absent ' + member.type + ' in group (' + memberId + ')');
    }
}
exports.default = Group;
