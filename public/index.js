"use strict";
let faders = [];
let mouseDown = false;
let selected = {
    faders: [],
    selected: [],
};
let currentSelection = { operation: 'selected', type: 'faders', start: -1, end: -1 };
//fix button display
let dmxButton = document.getElementById('dmx-format');
let fixturesButton = document.getElementById('fixtures-format');
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
dmxButton.onclick = () => {
    sendToSocket({ command: 'setFaderBank', bank: 'dmx' });
};
fixturesButton.onclick = () => {
    sendToSocket({ command: 'setFaderBank', bank: 'fixtures' });
};
function drawFaders(newFaders) {
    faders = newFaders;
    let grd = document.getElementById('grd');
    grd.innerHTML = '';
    grd.style.gridAutoColumns = 'var(--fader-width)';
    grd.style.gridTemplateRows =
        'var(--val-height) var(--fader-height) var(--name-height)';
    for (let x = 0; x < faders.length; x++) {
        let column = x + 1 + '/' + (x + 2);
        let val = document.createElement('input');
        val.id = 'val-' + x;
        val.value = String(Math.round(faders[x].value));
        val.className = 'val';
        val.onkeyup = (ev) => {
            if (ev.keyCode == 13) {
                processInput(val);
            }
            if (ev.keyCode == 27) {
                resetElement(val.id);
            }
        };
        /* val.onblur = () => {
          resetElement(val.id);
        }; */
        let div = document.createElement('div');
        div.className = 'val-label-div';
        div.style.gridColumn = column;
        div.style.gridRow = '1/2';
        if (faders[x].selected)
            div.style.backgroundColor = 'var(--selected-color)';
        div.appendChild(val);
        grd.appendChild(div);
        let fader = document.createElement('input');
        fader.id = 'fader-' + x;
        fader.setAttribute('type', 'range');
        let range = getFaderRange(faders[x].fader);
        fader.min = String(range.min);
        fader.max = String(range.max);
        fader.step = String(range.step);
        fader.value = String(faders[x].value);
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
        div = document.createElement('div');
        div.className = 'faderdiv';
        div.style.gridColumn = column;
        if (faders[x].selected)
            div.style.backgroundColor = 'var(--selected-color)';
        div.appendChild(fader);
        grd.appendChild(div);
        let label = document.createElement('div');
        label.id = 'label-' + x;
        let p = document.createElement('p');
        p.innerHTML = faders[x].label;
        label.appendChild(p);
        if (faders[x].fader.subLabel1) {
            label.appendChild(document.createElement('br'));
            p = document.createElement('p');
            p.style.color = 'var(--sub-label-1)';
            p.innerHTML = faders[x].fader.subLabel1;
            label.appendChild(p);
        }
        if (faders[x].fader.subLabel2) {
            label.appendChild(document.createElement('br'));
            p = document.createElement('p');
            p.style.color = 'var(--sub-label-2)';
            p.innerHTML = faders[x].fader.subLabel2;
            label.appendChild(p);
        }
        label.className = 'fader-label';
        label.oncontextmenu = (e) => {
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
        label.onmousedown = (e) => {
            if (e.button == 0) {
                e.preventDefault();
                mouseDown = true;
                let operation;
                if (!isSelected('faders', x)) {
                    operation = 'selected';
                }
                else
                    operation = 'deselected';
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
                });
            }
        };
        label.onmousemove = (e) => {
            e.preventDefault();
        };
        label.onmouseover = (e) => {
            if (mouseDown) {
                let oldEnd = currentSelection.end;
                currentSelection.end = x;
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
                        multiSelect('faders', currentSelection.start, oldEnd, currentSelection.operation, true);
                        multiSelect('faders', currentSelection.start, x, currentSelection.operation);
                        break;
                }
            }
        };
        label.onmouseup = () => {
            flash(label, 'off');
        };
        label.onmouseleave = () => {
            flash(label, 'off');
        };
        div = document.createElement('div');
        div.className = 'val-label-div';
        div.style.gridColumn = column;
        div.style.gridRow = '3/4';
        if (faders[x].selected)
            div.style.backgroundColor = 'var(--selected-color)';
        div.appendChild(label);
        grd.appendChild(div);
    }
    //
}
function flash(div, off) {
    let bgcolor = 'yellow';
    if (off) {
        bgcolor = '';
    }
    div.style.backgroundColor = bgcolor;
}
function processDataFromServer(msg) {
    switch (msg.type) {
        case 'info':
            if (msg.data != 'Command acknowledged')
                console.log('info: ' + JSON.stringify(msg.data));
            break;
        case 'drawFaders':
            faders = msg.data;
            drawFaders(msg.data);
            break;
        case 'updateFaders':
            for (let x = 0; x < msg.data.length; x++) {
                faders[msg.data[x].index].value = msg.data[x].value;
                let faderElement = document.getElementById('fader-' + msg.data[x].index);
                let valElement = document.getElementById('val-' + msg.data[x].index);
                if (document.activeElement != faderElement) {
                    faderElement.value = msg.data[x].value.toString();
                }
                if (document.activeElement != valElement) {
                    valElement.value = msg.data[x].value.toString(); //fix this for enums
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
/* function onValues(newValues: number[], type: faderType) {
  for (let x = 0; x < onScreenFaders.length; x++) {
    let fader = onScreenFaders[x];
    if (
      fader.type == type &&
      newValues[fader.number] != values[type][fader.number]
    ) {
      let faderElement = document.getElementById(
        'fader-' + type + '-' + fader.number
      ) as HTMLInputElement;
      let valElement = document.getElementById(
        'val-' + type + '-' + fader.number
      ) as HTMLInputElement;
      if (document.activeElement != faderElement) {
        faderElement.value = newValues[fader.number].toString();
      }
      if (document.activeElement != valElement)
        valElement.value = Math.round(newValues[fader.number] * 255).toString();
    }
  }
} */
function processInput(element) {
    let [elementType, numString] = element.id.split('-');
    let faderIndex = parseInt(numString);
    let value = parseFloat(element.value); //unless enum
    let faderId = 'fader-' + faderIndex.toString();
    let fader = document.getElementById(faderId);
    let valId = 'val-' + faderIndex.toString();
    let val = document.getElementById(valId);
    let range = getFaderRange(faders[faderIndex].fader);
    if ((!value && value != 0) || value < range.min || value > range.max) {
        console.error('bad input: ' + element.value);
        resetElement(valId);
    }
    else {
        sendToSocket({
            command: 'setValue',
            index: faderIndex,
            value: value,
        });
        switch (elementType) {
            case 'val':
                fader.value = value.toString();
                break;
            case 'fader':
                val.value = value.toString();
                break;
            default:
                console.error('bad element type');
                return;
        }
    }
}
function getFaderRange(fader) {
    switch (fader.type) {
        case 'range':
            let range = fader;
            return { min: range.min, max: range.max, step: range.step };
        case 'enum':
            let enumf = fader;
            return { min: 0, max: enumf.values.length - 1, step: 1 };
        default:
            console.error('Bad faders data in processInput');
            return { min: -1, max: -1, step: -1 };
    }
}
function resetElement(id) {
    let [type, numString] = id.split('-');
    let number = parseInt(numString);
    switch (type) {
        case 'val':
            let val = document.getElementById(id);
            val.value = faders[number].value.toString();
            break;
        case 'fader':
            console.error('code me');
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
            let fader = document.getElementById('fader-' + cmd.number)
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
