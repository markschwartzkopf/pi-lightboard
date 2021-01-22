let faders: faderData[] = [];

//fix button display
let dmxButton = document.getElementById('dmx-format') as HTMLButtonElement;
let fixturesButton = document.getElementById(
  'fixtures-format'
) as HTMLButtonElement;

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
  } else {
    root.style.setProperty('--fader-height', 'calc(calc(100vh - 6rem - 10px))');
  }
}
setFaderHeight();

window.onorientationchange = setFaderHeight;

const socket = new WebSocket('ws://' + window.location.host);
socket.onopen = () => {
  socket.onmessage = (msgJSON) => {
    let msg: serverMsg;
    try {
      msg = JSON.parse(msgJSON.data);
    } catch (e) {
      msg = {
        type: 'error',
        data: 'Invalid JSON from server.',
      };
    }
    processDataFromServer(msg);
  };
  sendToSocket({ command: 'init' });
};

function sendToSocket(msg: clientMsg) {
  socket.send(JSON.stringify(msg));
}

dmxButton.onclick = () => {
  /* format = 'dmx';
  reDrawFaders(); */
};

fixturesButton.onclick = () => {
  /*  format = 'fixture';
  reDrawFaders(); */
};

/* reDrawFaders(); */

/* function reDrawFaders() {
  let faderType: faderType;
  switch (format) {
    case 'dmx':
      selectedFixture = -1;
      faderType = 'dmx';
      dmxButton.style.backgroundColor = 'yellow';
      fixturesButton.style.backgroundColor = '';
      dmxButton.blur();
      break;
    case 'fixture':
      selectedFixture = -1;
      faderType = 'fixture';
      dmxButton.style.backgroundColor = '';
      fixturesButton.style.backgroundColor = 'yellow';
      fixturesButton.blur();
      break;
    case 'fixtureProperty':
      faderType = 'fixtureProperty';
      break;
    default:
  }
  drawFaders(values[format], labels[format], format);
} */

function drawFaders(newFaders: faderData[]): void {
  faders = newFaders;
  let grd = <HTMLDivElement>document.getElementById('grd')!;
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
    val.style.gridColumn = column;
    val.style.gridRow = '1/2';
    /* val.onkeyup = (ev) => {
      if (ev.keyCode == 13) {
        let [element, type, numString] = val.id.split('-') as [
          'val' | 'fader',
          faderType,
          string
        ];
        let number = parseInt(numString) / 255;
        processInput(element, type, number, parseFloat(val.value));
      }
      if (ev.keyCode == 27) {
        resetElement(val.id);
      }
    }; */
    /* val.onblur = () => {
      resetElement(val.id);
    }; */

    grd.appendChild(val);

    let fader = document.createElement('input');
    fader.id = 'fader-' + x;
    fader.setAttribute('type', 'range');
    let range = getFaderRange(faders[x].fader);
    fader.min = String(range.min);
    fader.max = String(range.max);
    fader.step = String(range.step);
    fader.value = String(faders[x].value);
    console.log(
      x +
        ' min:' +
        range.min +
        ' max:' +
        range.max +
        ' step:' +
        range.step +
        ' value:' +
        faders[x].value
    );
    
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
    let div = document.createElement('div');
    div.style.gridColumn = column;
    div.style.gridRow = '2/3';
    div.style.height = 'var(--fader-height)';
    div.style.width = 'var(--fader-width)';
    div.appendChild(fader);
    grd.appendChild(div);

    div = document.createElement('div');
    div.id = 'label-' + x;
    div.innerHTML = faders[x].label; //add sub labels
    div.className = 'fader-name';
    div.style.gridColumn = column;
    div.style.gridRow = '3/4';
    div.oncontextmenu = (e) => {
      e.preventDefault();
      /* let [element, type, numString] = div.id.split('-') as [
        'label',
        faderType,
        string
      ];
      if (type == 'fixture') {
        let number = parseInt(numString);
        sendToSocket({ command: 'getFixture', number: number });
      } */
    };
    div.onmousedown = (e) => {
      if (e.buttons == 1) flash(div);
    };
    div.onmouseup = () => {
      flash(div, 'off');
    };
    div.onmouseleave = () => {
      flash(div, 'off');
    };

    grd.appendChild(div);
  }
  //
}

function flash(div: HTMLDivElement, off?: 'off') {
  let bgcolor = 'yellow';
  if (off) {
    bgcolor = '';
  }
  div.style.backgroundColor = bgcolor;
}

function processDataFromServer(msg: serverMsg) {
  switch (msg.type) {
    case 'info':
      console.log(msg);
      break;
    case 'drawFaders':
      drawFaders(msg.data);
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

function processInput(element: HTMLInputElement) {
  let [elementType, numString] = element.id.split('-') as [
    'val' | 'fader',
    string
  ];
  let faderIndex = parseInt(numString);
  let value = parseFloat(element.value);
  let faderId = 'fader-' + faderIndex.toString();
  let fader = document.getElementById(faderId)! as HTMLInputElement;
  let valId = 'val-' + faderIndex.toString();
  let val = document.getElementById(valId)! as HTMLInputElement;
  let range = getFaderRange(faders[faderIndex].fader);
  if ((!value && value != 0) || value < range.min || value > range.max) {
    resetElement(valId);
    console.error('bad input: ' + value);
  } else {
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
        val.value = (value).toString();
        break;
      default:
        console.error('bad element type');
        return;
    }
  }
}

function getFaderRange(
  fader: fader
): { min: number; max: number; step: number } {
  switch (fader.type) {
    case 'range':
      let range = fader as rangeFader;
      return { min: range.min, max: range.max, step: range.step };
    case 'enum':
      let enumf = fader as enumFader;
      return { min: 0, max: enumf.values.length - 1, step: 1 };
    default:
      console.error('Bad faders data in processInput');
      return {min: -1, max: -1, step: -1}
  }
}

function resetElement(id: string) {
  let [element, type, numString] = id.split('-') as [
    'val' | 'fader' | 'label',
    faderType,
    string
  ];
  console.error('code resetElement');
  return;
  let number = parseInt(numString);
  switch (element) {
    case 'val':
      let val = document.getElementById(id) as HTMLInputElement;
      //val.value = Math.round(values[type][number] * 255).toString();
      break;
    case 'fader':
      console.error('code me');
      break;
    case 'label':
      console.error('code me');
      break;
  }
}

//testing code

//let test = document.getElementById('test')!;

/* drawDmxGrid(test, 4, 40, (num) => {
  console.log(num);
}); */

function drawDmxGrid(
  el: HTMLElement,
  num: number,
  current: number,
  callback: (num: number) => void
) {
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
      if (i > 0) i++;
      if (index == current) i = 1;
      if (i > 0 && i <= num) {
        cell.style.backgroundColor = 'yellow';
      }
      cell.onclick = () => {
        if (index + num <= 513) {
          callback(index);
          let i = 0;
          for (let y = 0; y < tbl.children.length; y++) {
            for (let x = 0; x < tbl.children[y].children.length; x++) {
              let elem = tbl.children[y].children[
                x
              ] as HTMLTableDataCellElement;
              if (i > 0) i++;
              if (parseInt(elem.innerHTML) == index) i = 1;
              if (i > 0 && i <= num) {
                elem.style.backgroundColor = 'yellow';
              } else elem.style.backgroundColor = '';
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
