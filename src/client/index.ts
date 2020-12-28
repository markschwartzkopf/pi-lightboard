let format: 'dmx' | 'fixtures' = 'fixtures';
if (new Array(10).length == 10) format = 'dmx';
let dmxValues: number[] = new Array(513).fill(0);
let dmxLabels: string[] = [...Array(513).keys()].map(String);
let onScreenFaders: { type: faderType; number: number }[] = [];

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
  sendToSocket({ command: 'dmx' });
};

function sendToSocket(msg: clientMsg) {
  socket.send(JSON.stringify(msg));
}

let mesg = <HTMLInputElement>document.getElementById('msg')!;
mesg.onkeydown = (e) => {
  if (e.keyCode == 13) {
    socket.send(mesg.value);
  }
  if (e.keyCode == 27) {
    socket.close();
  }
};

reDrawFaders();

function reDrawFaders() {
  switch (format) {
    case 'dmx':
      drawFaders(dmxValues, dmxLabels, 'dmx');
      break;
    case 'fixtures':
      break;
    default:
  }
}

function onDmxValues(newValues: number[]) {
  for (let x = 0; x < onScreenFaders.length; x++) {
    let fader = onScreenFaders[x];
    if (
      fader.type == 'dmx' &&
      newValues[fader.number] != dmxValues[fader.number]
    ) {
      let faderElement = document.getElementById(
        'fader-dmx-' + fader.number
      ) as HTMLInputElement;
      let valElement = document.getElementById(
        'val-dmx-' + fader.number
      ) as HTMLInputElement;
      if (document.activeElement != faderElement) {
        faderElement.value = newValues[fader.number].toString();
        
      }
      if (document.activeElement != valElement)
        valElement.value = Math.round(newValues[fader.number] * 255).toString();
    }
  }
  dmxValues = newValues;
}

function onDmxLabels(dmxLabels: string[]) {
  //populate DMX labels
  console.log('code populate DMX labels');
}
//code for control type: dmx, fixtures, groups, user

/* let tstArray1 = [0.5, 0.1, 0.5, 0.1, 0.5, 0.1];
let tstArray2 = ['dsgf cans longname', 'fdsg', '3', '4', '5', '6'];
//tstArray1 = [...tstArray1, ...new Array(500).fill(0.4)];
//tstArray2 = [...tstArray2, ...new Array(500).fill('hey')];
drawFaders(tstArray1, tstArray2, 'dmx'); */

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
  let startloop = 1;
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
    }
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
    fader.oninput = function (ev) {
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
    }
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
    grd.appendChild(div);
  }
  //
}

function processDataFromServer(msg: serverMsg) {
  switch (msg.type) {
    case 'dmxValues':
      onDmxValues(msg.data);
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

function processInput(
  element: 'val' | 'fader',
  type: faderType,
  number: number,
  value: number
) {
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
        });
        switch (type) {
          case 'dmx':
            dmxValues[number] = value / 255;
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
          val.value = Math.round(dmxValues[number] * 255).toString();
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
