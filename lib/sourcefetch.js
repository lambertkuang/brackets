'use babel';

import SourcefetchView from './sourcefetch-view';
import { CompositeDisposable, Point, Range } from 'atom';

let bracketToMatch;

const openMatches = {
  '{': '}',
  '[': ']',
  '(': ')'
};

const closedMatches = {
  '}': '{',
  ']': '[',
  ')': '('
};

const stack = [];

let count = 0;

export default {

  sourcefetchView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.sourcefetchView = new SourcefetchView(state.sourcefetchViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.sourcefetchView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'sourcefetch:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.sourcefetchView.destroy();
  },

  serialize() {
    return {
      sourcefetchViewState: this.sourcefetchView.serialize()
    };
  },

  // toggle() {
  //   console.log('Sourcefetch was toggled!');
  //   return (
  //     this.modalPanel.isVisible() ?
  //     this.modalPanel.hide() :
  //     this.modalPanel.show()
  //   );
  // }

  addToStack(bracket) {
    stack.push(bracket);
  },

  onBracketMatch(data) {
    console.log('match data --->', data.matchText);
    const currentMatch = data.matchText;

    if (!bracketToMatch) {
      console.log('setting as bracketToMatch');
      bracketToMatch = currentMatch;
      return;
    }

    if (stack.length) {
      // check if the current match matches the top most bracket of stack
      const topOfStack = stack[stack.length - 1];
      if (closedMatches[currentMatch] === topOfStack) {
        stack.pop();
        return;
      } else {
        this.addToStack(data.matchText);
      }
    } else {
      // found the corresponding bracket
      console.log('found --->', data.range);
      data.stop();
    }
  },

  toggle() {
    let editor = atom.workspace.getActiveTextEditor();
    if (editor) {
      const currentPosition = editor.getCursorBufferPosition().translate(new Point(0, 1));
      console.log(currentPosition);
      editor.backwardsScanInBufferRange(/(\{|\[|\(|\]|\}|\))/g, new Range(new Point(0, 1), currentPosition), this.onBracketMatch);
    }
  }

};
