'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const uuid_1 = require("uuid");
let allControlObjects = {
    objects: [],
    get ids() {
        return this.objects.map((x) => {
            return x.id;
        });
    },
};
class ControlObject extends events_1.EventEmitter {
    constructor(id) {
        super();
        this.label = '';
        if (id) {
            this.id = id;
        }
        else
            this.id = uuid_1.v4();
        Object.defineProperty(this, 'id', { writable: false }); //id should never change
        if (id != 'adHoc')
            allControlObjects.objects.push(this); //adHoc is the only non-unique id
    }
    initId() {
        if (this.id == 'adHoc') {
            Object.defineProperty(this, 'id', { value: uuid_1.v4() });
        }
        else
            console.error('Can only reinitialize ID of adHoc group');
    }
    getView(view) {
        let rtn = {
            controls: this.views[view].elements.map((x) => {
                return x.controlInterface;
            }),
            id: this.id,
            view: view,
            label: this.label,
            views: this.views.map((x) => {
                return x.label;
            }),
        };
        let dmxDirect = this.dmxDirect;
        if (dmxDirect) {
            let labels = dmxDirect.retrieveLabels(dmxDirect.channel);
            delete rtn.controls[0].label1;
            delete rtn.controls[0].label2;
            delete rtn.controls[0].label3;
            rtn.controls[0] = { ...rtn.controls[0], ...labels };
        }
        return rtn;
    }
    refreshViewValues(view) {
        let controlUpdates = [];
        for (let x = 0; x < this.views[view].elements.length; x++) {
            let currentValue = this.views[0].elements[x].getValue();
            if (this.views[view].elements[x].controlInterface.value != currentValue) {
                this.views[view].elements[x].controlInterface.value = currentValue;
                controlUpdates.push({ index: x, value: currentValue });
            }
        }
        if (controlUpdates.length > 0) {
            let clientViewUpdate = { controls: controlUpdates, id: this.id, view: view };
            this.emit(view.toString(), 'update', clientViewUpdate);
        }
    }
    static getObjectById(id) {
        let index = allControlObjects.ids.indexOf(id);
        if (index == -1) {
            console.error('no object with id: "' + id + '"');
            return null;
        }
        else
            return allControlObjects.objects[index];
    }
}
ControlObject.allControlObjects = allControlObjects;
exports.default = ControlObject;
