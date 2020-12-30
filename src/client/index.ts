let format: 'dmx' | 'fixtures' | 'fixture' = 'fixtures';
//let dmxValues: number[] = new Array(513).fill(0);
let dmxLabels: string[] = [...Array(513).keys()].map(String);
//let fixtureValues: number[] = new Array(1).fill(0);
let fixtureLabels: string[] = [...Array(1).keys()].map(String);

let values = {dmx: <number[]>new Array(513).fill(0), fixture: <number[]>new Array(1).fill(0)}
let onScreenFaders: { type: faderType; number: number }[] = [];
let initialized = {
  dmxValues: false,
  dmxLabels: false,
  fixtureValues: false,
  fixtureLabels: false,
  all: false,
  retries: 0,
};
let initTimeout: NodeJS.Timeout;
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
  init();
};

function sendToSocket(msg: clientMsg) {
  socket.send(JSON.stringify(msg));
}

dmxButton.onclick = () => {
  format = 'dmx';
  reDrawFaders();
};

fixturesButton.onclick = () => {
  format = 'fixtures';
  reDrawFaders();
};

reDrawFaders();

function reDrawFaders() {
  switch (format) {
    case 'dmx':
      drawFaders(values.dmx, dmxLabels, 'dmx');
      dmxButton.style.backgroundColor = 'yellow';
      fixturesButton.style.backgroundColor = '';
      dmxButton.blur();
      break;
    case 'fixtures':
      drawFaders(values.fixture, fixtureLabels, 'fixture');
      dmxButton.style.backgroundColor = '';
      fixturesButton.style.backgroundColor = 'yellow';
      fixturesButton.blur();
      break;
    default:
  }
}

function drawFaders(
  faderArray: number[],
  nameArray: string[],
  faderTyp: faderType | faderType[],
  faderNumber?: number[]
): void {
  if (
    faderArray.length != nameArray.length ||
    (Array.isArray(faderTyp) && faderArray.length != faderTyp.length)
  ) {
    console.error("'drawFaders' needs arrays to be the same size");
    return;
  }
  let startloop = 0;
  if (faderTyp == 'dmx') startloop = 1;
  if (!Array.isArray(faderTyp)) {
    faderTyp = new Array(faderArray.length).fill(String(faderTyp));
  }
  if (!faderNumber) {
    faderNumber = [...Array(faderArray.length).keys()];
  }
  onScreenFaders = [];
  let grd = <HTMLDivElement>document.getElementById('grd')!;
  grd.innerHTML = '';
  grd.style.gridAutoColumns = 'var(--fader-width)';
  grd.style.gridTemplateRows =
    'var(--val-height) var(--fader-height) var(--name-height)';

  for (let x = startloop; x < faderArray.length; x++) {
    onScreenFaders.push({ type: faderTyp[x], number: faderNumber[x] });
    let column = x + 1 - startloop + '/' + (x + 2 - startloop);
    let val = document.createElement('input');
    val.id = 'val-' + faderTyp[x] + '-' + faderNumber[x];
    val.value = String(Math.round(faderArray[x] * 255));
    val.className = 'val';
    val.style.gridColumn = column;
    val.style.gridRow = '1/2';
    val.onkeyup = (ev) => {
      if (ev.keyCode == 13) {
        let [element, type, numString] = val.id.split('-') as [
          'val' | 'fader',
          faderType,
          string
        ];
        let number = parseInt(numString);
        processInput(element, type, number, parseFloat(val.value));
      }
      if (ev.keyCode == 27) {
        resetElement(val.id);
      }
    };
    val.onblur = () => {
      resetElement(val.id);
    };
    grd.appendChild(val);

    let fader = document.createElement('input');
    fader.id = 'fader-' + faderTyp[x] + '-' + faderNumber[x];
    fader.setAttribute('type', 'range');
    fader.min = '0';
    fader.max = '1';
    fader.step = '0.001';
    fader.value = String(faderArray[x]);
    fader.style.width = 'var(--fader-height)'; //swapped because of 270deg rotation
    fader.style.height = 'var(--fader-width)'; //swapped because of 270deg rotation
    fader.oninput = (ev) => {
      let [element, type, numString] = fader.id.split('-') as [
        'val' | 'fader',
        faderType,
        string
      ];
      let number = parseInt(numString);
      processInput(element, type, number, parseFloat(fader.value));
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
    div.id = 'label-' + faderTyp[x] + '-' + faderNumber[x];
    div.innerHTML = nameArray[x];
    div.className = 'fader-name';
    div.style.gridColumn = column;
    div.style.gridRow = '3/4';
    div.oncontextmenu = (e) => {
      e.preventDefault();
      console.log('rightclick ' + div.id);
    };
    div.onmousedown = () => {
      flash(div);
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
    case 'dmxValues':
      init('dmxValues');
      onValues(msg.data, 'dmx');
      values.dmx = msg.data;
      break;
    case 'dmxClaims':
      init('dmxLabels');
      let newLabels: string[] = [];
      for (let x = 0; x < msg.data.length; x++) {
        if (msg.data[x]) {
          let div = document.createElement('div');
          let p = document.createElement('p');
          p.style.margin = '0em';
          p.style.color = 'green';
          p.innerHTML = msg.data[x]!.type;
          div.appendChild(p);
          p = document.createElement('p');
          p.style.margin = '0em';
          p.innerHTML = msg.data[x]!.fixtureLabel;
          div.appendChild(p);
          //newLabels[x] = msg.data[x]!.type + '\n' + msg.data[x]!.fixtureLabel;
          newLabels[x] = div.innerHTML;
        } else newLabels[x] = x.toString();
      }
      for (let x = 0; x < onScreenFaders.length; x++) {
        let fader = onScreenFaders[x];
        if (
          fader.type == 'dmx' &&
          newLabels[fader.number] != dmxLabels[fader.number]
        ) {
          let labelElement = document.getElementById(
            'label-dmx-' + fader.number
          ) as HTMLDivElement;
          labelElement.innerHTML = newLabels[fader.number];
        }
      }
      dmxLabels = newLabels;
      break;
    case 'fixtureValues':
      init('fixtureValues');
      // pad out or attenuate fixtureLabels if this changes fixture number
      if (msg.data.length != fixtureLabels.length) {
        let difference = msg.data.length - fixtureLabels.length;
        if (difference > 0) {
          fixtureLabels.push(...new Array(difference).fill(''));
        } else {
          fixtureLabels.splice(difference);
        }
      }

      //redraw if new number of fixtures, update otherwise
      if (msg.data.length != values.fixture.length) {
        values.fixture = msg.data;
        reDrawFaders();
      } else {
        onValues(msg.data, 'fixture');
        values.fixture = msg.data;
      }
      break;
    case 'fixtureLabels':
      init('fixtureLabels');
      // pad out or attenuate values.fixture if this changes fixture number
      if (msg.data.length != values.fixture.length) {
        let difference = msg.data.length - values.fixture.length;
        if (difference > 0) {
          values.fixture.push(...new Array(difference).fill(0));
        } else {
          values.fixture.splice(difference);
        }
      }

      //redraw if new number of fixtures, update otherwise
      if (msg.data.length != fixtureLabels.length) {
        fixtureLabels = msg.data;
        reDrawFaders();
      } else {
        for (let x = 0; x < onScreenFaders.length; x++) {
          let fader = onScreenFaders[x];
          if (
            fader.type == 'fixture' &&
            msg.data[fader.number] != fixtureLabels[fader.number]
          ) {
            let labelElement = document.getElementById(
              'label-fixture-' + fader.number
            ) as HTMLDivElement;
            labelElement.innerHTML = msg.data[fader.number];
          } else console.log(msg.data);
        }
        fixtureLabels = msg.data;
      }

      break;
    case 'info':
      break;
    case 'error':
      console.error('Error from server: ' + msg.data);
    default:
      console.error('Unknown message type from server');
      console.log(msg);
  }
}

function onValues(newValues: number[], type: faderType) {
  for (let x = 0; x < onScreenFaders.length; x++) {
    let fader = onScreenFaders[x];
    if (fader.type == type && newValues[fader.number] != values[type][fader.number]) {
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
}

function processInput(
  element: 'val' | 'fader',
  type: faderType,
  number: number,
  value: number
) {
  let valueName = 'value';
  let faderId = 'fader-' + type + '-' + number.toString();
  let fader = document.getElementById(faderId)! as HTMLInputElement;
  let valId = 'val-' + type + '-' + number.toString();
  let val = document.getElementById(valId)! as HTMLInputElement;
  switch (element) {
    case 'val':
      if (!value || value < 0 || value > 255) {
        resetElement(valId);
      } else {
        sendToSocket({
          command: 'setValue',
          type: type,
          number: number,
          value: value / 255,
          valueName: valueName
        });
        switch (type) {
          case 'dmx':
            values.dmx[number] = value / 255;
            fader.value = (value / 255).toString();
            break;
          case 'fixture':
            console.error('code me');
            break;
        }
      }
      break;
    case 'fader':
      val.value = Math.round(value * 255).toString();
      sendToSocket({
        command: 'setValue',
        type: type,
        number: number,
        value: value,
        valueName: valueName
      });
      break;
    default:
      console.error('bad element type');
      return;
  }
}

function resetElement(id: string) {
  let [element, type, numString] = id.split('-') as [
    'val' | 'fader' | 'label',
    faderType,
    string
  ];
  let number = parseInt(numString);
  switch (element) {
    case 'val':
      switch (type) {
        case 'dmx':
          let val = document.getElementById(id) as HTMLInputElement;
          val.value = Math.round(values.dmx[number] * 255).toString();
          break;
        case 'fixture':
          console.error('code me');
          break;
      }
      break;
    case 'fader':
      console.error('code me');
      break;
    case 'label':
      console.error('code me');
      break;
  }
}

function init(
  completed?: 'dmxValues' | 'dmxLabels' | 'fixtureValues' | 'fixtureLabels'
) {
  clearTimeout(initTimeout);
  if (completed) initialized[completed] = true;
  if (!initialized.dmxValues) {
    sendToSocket({ command: 'dmx' });
  } else if (!initialized.dmxLabels) {
    sendToSocket({ command: 'dmxClaims' });
  } else if (!initialized.fixtureValues) {
    sendToSocket({ command: 'fixtures' });
  } else if (!initialized.fixtureLabels) {
    sendToSocket({ command: 'fixtureLabels' });
  } else initialized.all = true;
  if (!initialized.all)
    initTimeout = setTimeout(() => {
      initialized.retries++;
      if (initialized.retries < 5) {
        init();
      } else console.error('Server poll timed out');
    }, 100);
}

//testing code
let test = document.getElementById('test')!;

drawDmxGrid(test, 4, 40, (num) => {
  console.log(num);
});

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
