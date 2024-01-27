// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "python-image-viewer" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	let disposable = vscode.commands.registerCommand('python-image-viewer.showPythonImage', () => {
		const editor = vscode.window.activeTextEditor;
		if(!editor) {
			return;
		}

		// get var name
		let document = editor.document;
		let var_range = document.getWordRangeAtPosition(editor.selection.active);
		const var_name = document.getText(var_range);
		console.log("var_name\n", var_name);

		let debugSession = vscode.debug.activeDebugSession;
		debugSession?.customRequest('stackTrace', { threadId: 1 }).then((response) => {
			const frameId = response.stackFrames[0].id;
			debugSession?.customRequest("evaluate", {
				expression: "print("+var_name+")", 
				frameId: frameId
			}).then((result) => {
				console.log("result\n", result);
			});
		});

		// console.log("debugSession\n", debugSession);
	});
	context.subscriptions.push(disposable);

	// vscode.debug.onDidChangeActiveDebugSession;
	// let dispHover = vscode.languages.registerHoverProvider('python', {
	// 	provideHover(document, position, token) {
	// 		const range = document.getWordRangeAtPosition(position);
	// 		const word = document.getText(range);
	// 		return new vscode.Hover(word);
	// 	}
	// });
	// context.subscriptions.push(dispHover);

	
}

// This method is called when your extension is deactivated
export function deactivate() {}
