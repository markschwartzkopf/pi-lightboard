'use strict';
import { EventEmitter } from 'events';
import { dmx } from './global';
import { v4 as uuidv4 } from 'uuid';

class Group extends EventEmitter {
  members: groupMember[] = [];
  excludes: groupExclude[] = [];
  id: string;
  fixtures: import('./fixtures').default[] = [];
  dmx: boolean = false;
  adHoc: boolean = true;

  constructor(id?: string) {
    super();
    if (id) {this.id = id} else this.id = uuidv4();
  }

  contains(fader: serverFader): boolean {
    if (fader.type == 'empty') return false;
    let idList = this._getIdListByType(fader.type);
    let faderId: string = '';
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
    if (idList.indexOf(faderId) == -1) {return false} else return true;
  }

  addMember(newMember: groupMember) {
    switch (newMember.type) {
      case 'dmx':
        if ((this.members.length > 0 && !this.dmx) || !this.adHoc) {
          console.error('Cannot add DMX member to non-DMX group');
        } else {
          let alreadyIn = this.members.some((x) => {
            let y = x as { type: 'dmx'; channel: number };
            return y.channel == newMember.channel;
          });
          if (!alreadyIn) {
            this.members.push(newMember);
          } else {
            console.warn('Tried to re-add existing DMX into group');
          }
          if (!this.dmx) {
            dmx.on('change', (changes) => {
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
        } else {
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
          } else {
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

  _getIdListByType(type: 'group' | 'fixture' | 'dmx') {
    let idList: string[] = [];
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
      } else idList.push('');
    }
    return idList;
  }

  removeMember(member: groupMember) {
    let idList = this._getIdListByType(member.type);
    let memberId: string = '';
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
    } else
      console.warn(
        'Tried to remove already absent ' + member.type + ' in group (' + memberId + ')'
      );
  }
}

export default Group;
