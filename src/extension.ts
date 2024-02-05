// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getVarName, getVarType } from './utils/EvalPyUtils';
import { saveImage } from './utils/PILUtils';
import { getWebviewContent } from './components/ImagePanel';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "python-image-viewer" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	// Resigter showPythonImage command
	let disposable = vscode.commands.registerCommand('python-image-viewer.showPythonImage', () => {
		let var_name = getVarName();
		console.log("var_name\n", var_name);
		if (!var_name) {
			vscode.window.showErrorMessage("Cannot get variable name.");
			return;
		}

		let debugSession = vscode.debug.activeDebugSession!;
		debugSession?.customRequest('stackTrace', { threadId: 1 }).then(async (response) => {
			let frameId = response.stackFrames[0].id;

			// core logic
			let var_type = await getVarType(var_name!, debugSession, frameId);
			let pwd = vscode.workspace.workspaceFolders![0].uri;
			let saveDir = vscode.Uri.joinPath(pwd, '.python-image-viewer');
			
			try{
				vscode.workspace.fs.createDirectory(saveDir);
			}
			catch(err) {
				console.log(err);
				if (err === vscode.FileSystemError.NoPermissions) {
					vscode.window.showErrorMessage("No permission to create temporary directory. The extension will not work.");
					return;
				}
			}
			
			let imgPath = await saveImage(var_name!, saveDir, debugSession, frameId);

			const panel = vscode.window.createWebviewPanel(
				'imageViewerPanel',
				'PyImgViewer-' + var_name!,
				vscode.ViewColumn.Beside,
				{}
			  );
		
			  // And get the special URI to use with the webview
			  const imgSrc = panel.webview.asWebviewUri(imgPath);
		
			  panel.webview.html = getWebviewContent(imgSrc);
		});

	});

	context.subscriptions.push(disposable);


	vscode.debug.onDidTerminateDebugSession((session) => {	
		let pwd = vscode.workspace.workspaceFolders![0].uri;
		let saveDir = vscode.Uri.joinPath(pwd, '.python-image-viewer');
		vscode.workspace.fs.delete(saveDir, {recursive: true, useTrash: false});
	});
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
export function deactivate() {
	// TODO: delete when deactive
	// let pwd = vscode.workspace.workspaceFolders![0].uri;
	// let saveDir = vscode.Uri.joinPath(pwd, '.python-image-viewer');
	// vscode.workspace.fs.delete(saveDir, {recursive: true, useTrash: false});

	// console.log("Extension deactivated.");
}
