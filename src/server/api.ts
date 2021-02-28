'use strict';
export { processApiCmd };
import { error } from 'console';
import { myWebSocket } from './server';

function processApiCmd(msg: clientMsg, ws: myWebSocket): serverMsg {
  switch (msg.command) {
    case 'init':
      return {
        type: 'userNavButtons',
        data: ws.userNavButtons,
      };
      break;
    case 'setValue':
      let setValueCommand: setValueCommand;
      {
        let { command: string, ...theRest } = msg;
        setValueCommand = theRest;
      }
      ws.setValue(setValueCommand);
      return { type: 'info', data: 'Command acknowledged' };
      break;
    case 'subscribe':
      let subscribeCommand: subscribeCommand;
      {
        let { command: string, ...theRest } = msg;
        subscribeCommand = theRest;
      }
      let clientView = ws.subscribe(subscribeCommand);
      if (clientView == null)
        return { type: 'error', data: 'No such control object' };
      return { type: 'controlView', data: clientView };
      break;
    case 'unsubscribe':
      let unsubscribeCommand: subscribeCommand;
      {
        let { command: string, ...theRest } = msg;
        unsubscribeCommand = theRest;
      }
      if (ws.unsubscribe(unsubscribeCommand)) {
        return { type: 'info', data: 'Command acknowledged' };
      } else return { type: 'error', data: 'No such subscription' };
      break;
    case 'select':
      let selectCommand: selectCommand;
      {
        let { command: string, ...theRest } = msg;
        selectCommand = theRest;
      }
      ws.select(selectCommand);
      //console.log(msg.number + ' ' + msg.operation + ' reset: ' + msg.reset);
      return {
        type: 'info',
        data: 'Command acknowledged',
      };
      break;
    default:
      console.error('Received bad command: ' + msg);
      return {
        type: 'error',
        data: 'Invalid command received',
      };
  }
}
