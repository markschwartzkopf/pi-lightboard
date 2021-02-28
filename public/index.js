"use strict";
let mouseDown = false;
let selected = {
    faders: [],
    selected: [],
};
let currentSelection = { operation: 'selected', type: 'faders', start: -1, end: -1 };
let subscriptions = {
    primary: null,
    secondary: null,
};
let userNavButtons = [];
function setFaderHeight() {
    const root = document.documentElement;
    root.style.fontSize = window.devicePixelRatio * 20 + 'px';
    if (window.orientation != 90 && window.orientation != -90) {
        if (root.style.getPropertyValue('--fader-height') != '15rem') {
            root.style.setProperty('--fader-height', '15rem');
        }
        /* root.style.setProperty(
          '--fader-height',
          400 * window.devicePixelRatio + 'px'
        ); */
    }
    else {
        root.style.setProperty('--fader-height', 'calc(calc(100vh - 6rem - 10px))');
    }
}
setFaderHeight();
window.onorientationchange = setFaderHeight;
window.onmouseup = (e) => {
    if (e.button == 0)
        mouseDown = false;
};
const socket = new WebSocket('ws://' + window.location.host);
socket.onopen = () => {
    socket.onmessage = (msgJSON) => {
        let msg;
        try {
            msg = JSON.parse(msgJSON.data);
        }
        catch (e) {
            msg = {
                type: 'error',
                data: 'Invalid JSON from server.',
            };
        }
        processDataFromServer(msg);
    };
    sendToSocket({ command: 'init' });
};
function sendToSocket(msg) {
    socket.send(JSON.stringify(msg));
}
function updateView(divId, update) {
    for (let x = 0; x < update.controls.length; x++) {
        let index = update.controls[x].index;
        subscriptions[divId].controls[index].value = update.controls[x].value;
        let valDiv1 = document.getElementById('val-' + index + '-0');
        let valDiv2 = document.getElementById('val-' + index + '-1');
        let controlDiv = document.getElementById('control-' + index);
        resetElement(valDiv1);
        resetElement(valDiv2);
        resetElement(controlDiv);
    }
}
function populateView(divId, view) {
    let grd = document.getElementById(divId);
    grd.innerHTML = '';
    for (let x = 0; x < view.controls.length; x++) {
        subscriptions[divId].controls[x] = view.controls[x];
        grd.appendChild(createValDiv(view.controls[x], x));
        grd.appendChild(createControlDiv(view.controls[x], x));
        grd.appendChild(createLabelDiv(view.controls[x], x));
    }
}
function createValDiv(control, column) {
    let valDiv = document.createElement('div');
    valDiv.className = 'val-label-div';
    valDiv.style.gridColumn = columnString(column);
    valDiv.style.gridRow = '1/2';
    let values = getValue(control);
    for (let x = 0; x < values.length; x++) {
        let valInput = document.createElement('input');
        valInput.id = 'val-' + column + '-' + x;
        valInput.value = values[x].value;
        valInput.className = 'val';
        valInput.onkeyup = (ev) => {
            if (ev.keyCode == 13) {
                processInput(valInput);
            }
            if (ev.keyCode == 27) {
                resetElement(valInput);
            }
        };
        valInput.onblur = () => {
            resetElement(valInput);
        };
        valDiv.appendChild(valInput);
    }
    console.error('fix create-val-selected');
    //if (???) valDiv.style.backgroundColor = 'var(--selected-color)';
    return valDiv;
}
function getValue(control) {
    switch (control.type) {
        case 'range':
            return [{ value: Math.round(control.value * 100).toString() + '%' }];
            break;
        case 'enum':
            console.error('code me');
            break;
        case 'loop':
            console.error('code me');
            break;
        case 'color':
            console.error('code me');
            break;
        case 'colorEnum':
            console.error('code me');
            break;
    }
    return [{ value: 'Code Me!' }];
}
function createControlDiv(control, column) {
    let controlDiv = document.createElement('div');
    controlDiv.className = 'faderdiv';
    controlDiv.style.gridColumn = columnString(column);
    switch (control.type) {
        case 'range':
            let fader = document.createElement('input');
            fader.id = 'control-' + column;
            fader.setAttribute('type', 'range');
            fader.min = '0';
            fader.max = '1';
            fader.step = '.000001';
            fader.value = control.value.toString();
            fader.style.width = 'var(--fader-height)'; //swapped because of 270deg rotation
            fader.style.height = 'var(--fader-width)'; //swapped because of 270deg rotation
            fader.oninput = (ev) => {
                processInput(fader);
            };
            fader.onchange = () => {
                fader.blur();
            };
            fader.onmouseup = () => {
                fader.blur();
            };
            controlDiv.appendChild(fader);
            break;
        case 'enum':
            console.error('code me');
            break;
        case 'loop':
            console.error('code me');
            break;
        case 'color':
            console.error('code me');
            break;
        case 'colorEnum':
            console.error('code me');
            break;
    }
    console.error('fix create-control-selected');
    //if (???) controlDiv.style.backgroundColor = 'var(--selected-color)';
    return controlDiv;
}
function createLabelDiv(control, column) {
    let labelDivDiv = document.createElement('div');
    labelDivDiv.className = 'val-label-div';
    labelDivDiv.style.gridColumn = columnString(column);
    labelDivDiv.style.gridRow = '3/4';
    let labelDiv = document.createElement('div');
    labelDiv.id = 'label-' + column;
    labelDiv.className = 'control-label';
    if (control.label1) {
        let p = document.createElement('p');
        p.innerHTML = control.label1;
        labelDiv.appendChild(p);
    }
    if (control.label2) {
        if (control.label1)
            labelDiv.appendChild(document.createElement('br'));
        let p = document.createElement('p');
        p.style.color = 'var(--label-2)';
        p.innerHTML = control.label2;
        labelDiv.appendChild(p);
    }
    if (control.label3) {
        if (control.label2 || control.label1)
            labelDiv.appendChild(document.createElement('br'));
        let p = document.createElement('p');
        p.style.color = 'var(--label-3)';
        p.innerHTML = control.label3;
        labelDiv.appendChild(p);
    }
    labelDiv.oncontextmenu = (e) => {
        e.preventDefault();
        /* let [element, type, numString] = label.id.split('-') as [
            'label',
            faderType,
            string
          ];
          if (type == 'fixture') {
            let number = parseInt(numString);
            sendToSocket({ command: 'getFixture', number: number });
          } */
    };
    labelDiv.onmousedown = (e) => {
        if (e.button == 0) {
            e.preventDefault();
            mouseDown = true;
            let operation;
            /* if (!isSelected('faders', x)) {
              operation = 'selected';
            } else operation = 'deselected';
            currentSelection = {
              operation: operation,
              type: 'faders',
              start: x,
              end: x,
            };
            select({
              number: x,
              type: 'faders',
              operation: operation,
              reset: true,
            }); */
        }
    };
    labelDiv.onmousemove = (e) => {
        e.preventDefault();
    };
    labelDiv.onmouseover = (e) => {
        if (mouseDown) {
            let oldEnd = currentSelection.end;
            /* currentSelection.end = x;
            switch (isBetween(x, currentSelection.start, oldEnd)) {
              case 'atEnd':
                return;
              case 'between':
                multiSelect('faders', x, oldEnd, currentSelection.operation, true);
                break;
              case 'beyond':
                multiSelect('faders', oldEnd, x, currentSelection.operation);
                break;
              case 'reverse':
                multiSelect(
                  'faders',
                  currentSelection.start,
                  oldEnd,
                  currentSelection.operation,
                  true
                );
                multiSelect(
                  'faders',
                  currentSelection.start,
                  x,
                  currentSelection.operation
                );
                break;
            } */
        }
    };
    labelDiv.onmouseup = () => {
        flash(labelDiv, 'off');
    };
    labelDiv.onmouseleave = () => {
        flash(labelDiv, 'off');
    };
    labelDivDiv.appendChild(labelDiv);
    //if (faders[x].selected) labelDivDiv.style.backgroundColor = 'var(--selected-color)';
    return labelDivDiv;
}
function columnString(column) {
    return column + 1 + '/' + (column + 2);
}
function flash(div, off) {
    let bgcolor = 'yellow';
    if (off) {
        bgcolor = '';
    }
    div.style.backgroundColor = bgcolor;
}
function updateButtons(buttons) {
    userNavButtons = buttons;
    let buttonDiv = document.getElementById('buttons');
    buttonDiv.innerHTML = '';
    for (let x = 0; x < userNavButtons.length; x++) {
        let button = document.createElement('span');
        button.className = 'nav-button';
        button.innerHTML = userNavButtons[x].label;
        button.id = 'nav-btn-' + x;
        buttonDiv.appendChild(button);
        button.oncontextmenu = (e) => {
            e.preventDefault();
        };
        button.onclick = (e) => {
            switch (e.button) {
                case 0:
                    subscribe(userNavButtons[x].id, 'primary');
                    break;
            }
        };
    }
}
function processDataFromServer(msg) {
    var _a, _b, _c, _d;
    switch (msg.type) {
        case 'info':
            if (msg.data != 'Command acknowledged')
                console.log('info: ' + JSON.stringify(msg.data));
            break;
        case 'userNavButtons':
            updateButtons(msg.data);
            if (subscriptions.primary == null)
                subscribe(userNavButtons[0].id, 'primary');
            break;
        case 'controlView':
            let locations = Object.getOwnPropertyNames(subscriptions);
            for (let x = 0; x < locations.length; x++) {
                if (((_a = subscriptions[locations[x]]) === null || _a === void 0 ? void 0 : _a.id) == msg.data.id &&
                    ((_b = subscriptions[locations[x]]) === null || _b === void 0 ? void 0 : _b.view) == msg.data.view) {
                    populateView(locations[x], msg.data);
                }
            }
            break;
        case 'controlViewUpdate':
            let locations2 = Object.getOwnPropertyNames(subscriptions);
            for (let x = 0; x < locations2.length; x++) {
                if (((_c = subscriptions[locations2[x]]) === null || _c === void 0 ? void 0 : _c.id) == msg.data.id &&
                    ((_d = subscriptions[locations2[x]]) === null || _d === void 0 ? void 0 : _d.view) == msg.data.view) {
                    updateView(locations2[x], msg.data);
                }
            }
            break;
        case 'error':
            console.error('Error from server: ' + msg.data);
        default:
            console.error('Unknown message type from server');
            console.log(msg);
    }
}
function subscribe(id, location, view) {
    var _a, _b;
    if (!view)
        view = 0;
    let [currentId, currentView] = [
        (_a = subscriptions[location]) === null || _a === void 0 ? void 0 : _a.id,
        (_b = subscriptions[location]) === null || _b === void 0 ? void 0 : _b.view,
    ];
    if (currentId != id || currentView != view) {
        if (currentId != undefined && currentView != undefined)
            sendToSocket({
                command: 'unsubscribe',
                id: currentId,
                view: currentView,
            });
        subscriptions[location] = { id: id, view: view, controls: [] };
        sendToSocket({ command: 'subscribe', id: id, view: view });
    }
}
function processInput(element) {
    let location = element.parentElement.parentElement.id;
    let [HTMLElementType, ...numString] = element.id.split('-');
    let controlIndex = parseInt(numString[0]);
    let controlInterface = subscriptions[location].controls[controlIndex];
    if (!controlInterface) {
        console.error('HTML control with no subsctiption');
        return;
    }
    switch (HTMLElementType) {
        case 'val':
            switch (controlInterface.type) {
                case 'range':
                    let valueCandidate = parseFloat(element.value) / 100;
                    if (valueCandidate <= 1 && valueCandidate >= 0)
                        controlInterface.value = valueCandidate;
                    break;
            }
            resetElement(document.getElementById('val-' + controlIndex + '-0'));
            resetElement(document.getElementById('control-' + controlIndex));
            break;
        case 'control':
            switch (controlInterface.type) {
                case 'range':
                    controlInterface.value = parseFloat(element.value);
                    break;
            }
            resetElement(document.getElementById('val-' + controlIndex + '-0'));
            break;
    }
    sendToSocket({
        command: 'setValue',
        id: subscriptions[location].id,
        view: subscriptions[location].view,
        controlIndex: controlIndex,
        value: controlInterface.value,
    });
}
function resetElement(element) {
    var _a;
    if (!element)
        return;
    let location = element.parentElement.parentElement.id;
    let [type, ...numStrings] = element.id.split('-');
    let controlIndex = parseInt(numStrings[0]);
    let controlInterface = (_a = subscriptions[location]) === null || _a === void 0 ? void 0 : _a.controls[controlIndex];
    if (!controlInterface) {
        console.error('HTML control with no subsctiption');
        return;
    }
    switch (type) {
        case 'val':
            switch (controlInterface.type) {
                case 'range':
                    element.value =
                        Math.round(controlInterface.value * 100).toString() + '%';
                    break;
            }
            break;
        case 'control':
            switch (controlInterface.type) {
                case 'range':
                    element.value = controlInterface.value.toString();
                    break;
            }
            break;
        case 'label':
            console.error('code me');
            break;
    }
}
function select(cmd) {
    sendToSocket(Object.assign({ command: 'select' }, cmd));
    selectIndicate(cmd);
    let itemSelected = false;
    if (cmd.operation == 'selected')
        itemSelected = true;
    if (cmd.reset)
        selected = { faders: [], selected: [] };
    if (itemSelected && !isSelected(cmd.type, cmd.number)) {
        selected[cmd.type].push(cmd.number);
    }
    if (!itemSelected && isSelected(cmd.type, cmd.number)) {
        selected[cmd.type].splice(selected[cmd.type].indexOf(cmd.number), 1);
    }
}
function selectIndicate(cmd) {
    if (cmd.reset) {
        for (let x = 0; x < selected.faders.length; x++) {
            selectIndicate({
                number: selected.faders[x],
                type: 'faders',
                operation: 'deselected',
                reset: false,
            });
        }
        for (let x = 0; x < selected.selected.length; x++) {
            selectIndicate({
                number: selected.selected[x],
                type: 'selected',
                operation: 'deselected',
                reset: false,
            });
        }
    }
    let color = 'var(--selected-color)';
    if (cmd.operation == 'deselected')
        color = '';
    switch (cmd.type) {
        case 'faders':
            let val = document.getElementById('val-' + cmd.number).parentElement;
            let fader = document.getElementById('control-' + cmd.number)
                .parentElement;
            let label = document.getElementById('label-' + cmd.number)
                .parentElement;
            val.style.backgroundColor = color;
            fader.style.backgroundColor = color;
            label.style.backgroundColor = color;
            break;
        case 'selected':
            console.log('code select fader background color change');
            break;
    }
}
function multiSelect(type, start, end, operation, reverse) {
    if (reverse) {
        if (operation == 'selected') {
            operation = 'deselected';
        }
        else
            operation = 'selected';
    }
    if (start == end)
        return;
    if (start > end) {
        start--;
    }
    else
        start++; //do not include start;
    let min = Math.min(start, end);
    let max = Math.max(start, end);
    for (let x = min; x <= max; x++) {
        select({ number: x, type: type, operation: operation, reset: false });
    }
}
function isSelected(type, number) {
    if (selected[type].indexOf(number) == -1) {
        return false;
    }
    else
        return true;
}
function isBetween(x, bound1, bound2) {
    let min = Math.min(bound1, bound2);
    let max = Math.max(bound1, bound2);
    if (x == bound2) {
        return 'atEnd';
    }
    else if ((x > min && x < max) || (x == bound1 && bound1 != bound2)) {
        return 'between';
    }
    else if ((bound2 >= bound1 && x > bound2) ||
        (bound1 >= bound2 && x < bound2)) {
        return 'beyond';
    }
    else
        return 'reverse';
}
//testing code
//let test = document.getElementById('test')!;
/* drawDmxGrid(test, 4, 40, (num) => {
  console.log(num);
}); */
function drawDmxGrid(el, num, current, callback) {
    let tbl = document.createElement('table');
    tbl.style.height = '100%';
    tbl.style.width = '100%';
    tbl.style.tableLayout = 'fixed';
    tbl.style.borderCollapse = 'collapse';
    let i = 0;
    for (let y = 0; y < 16; y++) {
        let row = document.createElement('tr');
        for (let x = 0; x < 32; x++) {
            let cell = document.createElement('td');
            cell.style.fontSize = el.clientWidth / 60 + 'px';
            cell.style.fontWeight = '700';
            cell.style.overflow = 'hidden';
            cell.style.border = '1px solid black';
            cell.style.padding = '0';
            cell.style.textAlign = 'center';
            let index = 1 + x + y * 32;
            cell.innerHTML = index.toString();
            cell.style.cursor = 'default';
            if (i > 0)
                i++;
            if (index == current)
                i = 1;
            if (i > 0 && i <= num) {
                cell.style.backgroundColor = 'yellow';
            }
            cell.onclick = () => {
                if (index + num <= 513) {
                    callback(index);
                    let i = 0;
                    for (let y = 0; y < tbl.children.length; y++) {
                        for (let x = 0; x < tbl.children[y].children.length; x++) {
                            let elem = tbl.children[y].children[x];
                            if (i > 0)
                                i++;
                            if (parseInt(elem.innerHTML) == index)
                                i = 1;
                            if (i > 0 && i <= num) {
                                elem.style.backgroundColor = 'yellow';
                            }
                            else
                                elem.style.backgroundColor = '';
                        }
                    }
                }
            };
            row.appendChild(cell);
        }
        tbl.appendChild(row);
    }
    el.innerHTML = '';
    el.appendChild(tbl);
}
