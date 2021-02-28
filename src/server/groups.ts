'use strict';
import ControlObject from './control-object';
import { v4 as uuidv4 } from 'uuid';

let allGroups: Group | undefined;

class Group extends ControlObject {
  members: ControlObject[] = [];
  unSubs: { [id: string]: viewListener } = {};
  excludes: groupExclude[] = [];
  values: groupValue[] = [];
  readonly type = 'group';

  constructor(id?: string) {
    super(id);
    this.views = [
      { label: 'Members', elements: [] },
      { label: 'Properties', elements: [] },
    ];
    switch (this.id) {
      case 'allDmx':
        this.views.pop();
        this.views[0].label = 'DMX';
        break;
      case 'allFixtures':
        this.views.pop();
        this.views[0].label = 'Fixtures';
        break;
      case 'allUserGroups':
        this.views.pop();
        this.views[0].label = 'Groups';
        break;
      default:
        if (allGroups) allGroups.addMember(this);
        break
    }
  }

  /* getValue(valueName: string): number;
  getValue(): { valueName: string; value: number }[];
  getValue(
    valueName?: string
  ): number | { valueName: string; value: number }[] {
    if (!valueName) {
      let rtn: { valueName: string; value: number }[] = [];
      //
      return rtn;
    }

    return -1;
  }

  setValue(newVal: number, valueName?: string) {
    if (!valueName) valueName = 'value';
  }

  fader(valueName?: string): fader {
    if (!valueName) valueName = 'value';
    return { type: 'empty' };
  }
 */
  //based upon old ideas:
  /* initValues(): void {
    this.values = [];
    let keyIndex: { [valueName: string]: number } = {};
    for (let x = 0; x < this.members.length; x++) {
      let groupMember = this.members[x];
      switch (groupMember.type) {
        case 'fixture':
          let values = groupMember.getValue();
          for (let y = 0; y < values.length; y++) {
            if (keyIndex[values[y].valueName] === undefined) {
              keyIndex[values[y].valueName] = this.values.length;
              this.values.push({
                valueName: values[y].valueName,
                current: NaN,
                start: NaN,
                members: [
                  {
                    member: { type: 'fixture', member: groupMember.member },
                    startValue: values[y].value,
                  },
                ],
              });
            } else {
              this.values[keyIndex[values[y].valueName]].members.push({
                member: { type: 'fixture', member: groupMember.member },
                startValue: values[y].value,
              });
            }
          }
          break;
        case 'group':
          break;
      }
    }
    for (let x = 0; x < this.values.length; x++) {
      let sum = 0;
      for (let y = 0; y < this.values[x].members.length; y++) {
        sum += this.values[x].members[y].startValue;
      }
      this.values[x].start = sum / this.values[x].members.length;
      this.values[x].current = this.values[x].start;
    }
    console.log(this.values);
  } */

  /* contains(fader: serverFader): boolean {
    if (fader.type == 'empty') return false;
    if (this.memberIds.indexOf(fader.member.id) == -1) {
      return false;
    } else return true;
  } */

  get memberIds(): string[] {
    return this.members.map((x) => {
      return x.id;
    });
  }

  addMember(newMember: ControlObject) {
    let alreadyIn = this.members.some((x) => {
      return x.id == newMember.id;
    });
    if (!alreadyIn) {
      this.members.push(newMember);
      let memberViews = newMember.views.map((x) => {
        return x.label;
      });
      let viewIndex = memberViews.indexOf('Properties');
      if (viewIndex == -1) {
        console.error('Added control object with no "Properties" view');
        return;
      }
      let memberProperties = newMember.views[viewIndex].elements.map((x) => {
        return x.controlInterface.label2;
      });
      let propertyIndex = memberProperties.indexOf('value');
      if (propertyIndex == -1) {
        console.error('Added control object with no "value" property: ' + newMember.id);
        return;
      }
      let valueElement = newMember.views[viewIndex].elements[propertyIndex];
      let controlInterface = JSON.parse(
        JSON.stringify(valueElement.controlInterface)
      );
      delete controlInterface.label2;
      controlInterface.label1 = newMember.label;
      this.views[0].elements.push({
        setValue: valueElement.setValue,
        getValue: () => {return valueElement.controlInterface.value},
        controlInterface: controlInterface,
      });
      let valueListener: viewListener = (type: 'init' | 'update', change: clientView | clientViewUpdate) => {
        switch(type) {
          case 'init':
            console.error('code group valueListener "init"');
            break;
          case 'update':
            let clientViewUpdate = change as clientViewUpdate;
            for (let x = 0; x < clientViewUpdate.controls.length; x++) {
              if (clientViewUpdate.controls[x].index == propertyIndex) this.refreshViewValues(0);
              //
              //update properties
              //
            }
            break;
        }
      };
      newMember.on(viewIndex.toString(), valueListener);
    } else {
      console.warn('Tried to re-add existing fixture into group');
    }

    if (newMember.type == 'group') {
      console.error('Code adding groups to groups');
      //check for loops
    }
  }

  removeMember(member: ControlObject) {
    let index = this.memberIds.indexOf(member.id);
    if (index > -1) {
      this.members.splice(index, 1);
      //
      //Unsubscribe to changes
      //
    } else
      console.warn(
        'Tried to remove already absent ' +
          member.type +
          ' in group (id: ' +
          member.id +
          ')'
      );
  }
}

allGroups = new Group('allGroups');

export default Group;
