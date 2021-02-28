'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const control_object_1 = __importDefault(require("./control-object"));
let allGroups;
class Group extends control_object_1.default {
    constructor(id) {
        super(id);
        this.members = [];
        this.unSubs = {};
        this.excludes = [];
        this.values = [];
        this.type = 'group';
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
                if (allGroups)
                    allGroups.addMember(this);
                break;
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
    get memberIds() {
        return this.members.map((x) => {
            return x.id;
        });
    }
    addMember(newMember) {
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
            let controlInterface = JSON.parse(JSON.stringify(valueElement.controlInterface));
            delete controlInterface.label2;
            controlInterface.label1 = newMember.label;
            this.views[0].elements.push({
                setValue: valueElement.setValue,
                getValue: () => { return valueElement.controlInterface.value; },
                controlInterface: controlInterface,
            });
            let valueListener = (type, change) => {
                switch (type) {
                    case 'init':
                        console.error('code group valueListener "init"');
                        break;
                    case 'update':
                        let clientViewUpdate = change;
                        for (let x = 0; x < clientViewUpdate.controls.length; x++) {
                            if (clientViewUpdate.controls[x].index == propertyIndex)
                                this.refreshViewValues(0);
                            //
                            //update properties
                            //
                        }
                        break;
                }
            };
            newMember.on(viewIndex.toString(), valueListener);
        }
        else {
            console.warn('Tried to re-add existing fixture into group');
        }
        if (newMember.type == 'group') {
            console.error('Code adding groups to groups');
            //check for loops
        }
    }
    removeMember(member) {
        let index = this.memberIds.indexOf(member.id);
        if (index > -1) {
            this.members.splice(index, 1);
            //
            //Unsubscribe to changes
            //
        }
        else
            console.warn('Tried to remove already absent ' +
                member.type +
                ' in group (id: ' +
                member.id +
                ')');
    }
}
allGroups = new Group('allGroups');
exports.default = Group;
