import * as vscode from 'vscode';
import {evalExpr} from './EvalPyUtils';


// export function displayImage() {
//     let panel = vscode.window.createWebviewPanel(
//         'pythonImageViewer',
//         'Python Image Viewer',
//         vscode.ViewColumn.One,
//         {
//             enableScripts: true
//         }
//     );

//     panel.webview.html = getWebviewContent();
// }


// function getWebviewContent() {
//     // implementation of getWebviewContent
    
// }


export async function saveImage(imgName: string, saveDir: vscode.Uri, debugSession: vscode.DebugSession, frameId: any) {
    // imgName.save(saveDir + '/' + imgName + '.png')
    let savePath = vscode.Uri.joinPath(saveDir, imgName + '.png');
    let expr = imgName + ".save('" + savePath.fsPath + "')";
    let result = await evalExpr(expr, debugSession, frameId);
    console.log(result);
    return savePath;
}