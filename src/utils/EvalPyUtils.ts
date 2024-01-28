import * as vscode from 'vscode';
import { VarType } from '../enums/VarType';


export function getVarName(): string | undefined {
    const editor = vscode.window.activeTextEditor;
    if(!editor) {
        return undefined;
    }
    let document = editor.document;
    let var_range = document.getWordRangeAtPosition(editor.selection.active);
    let var_name = document.getText(var_range);
    return var_name;
}


export async function evalExpr(
    expression: string, 
    debugSession: vscode.DebugSession, 
    frameId: any
): Promise<any> {

    let result = await debugSession.customRequest('evaluate', {
        expression: expression, 
        frameId: frameId
    });

    return result;
}


export async function getVarType(
    var_name: string, 
    debugSession: vscode.DebugSession, 
    frameId: any
): Promise<VarType> {

    let expr = "type("+var_name+")";
    let result = await evalExpr(expr, debugSession, frameId);

    if (!result) {
        return VarType.undefined;
    }
    
    let var_type: VarType;
    if (result.result.includes("numpy")) {
        var_type = VarType.numpy;
    } 
    else if (result.result.includes("PIL")) {
        var_type = VarType.PIL;
    }
    else {
        var_type = VarType.others;
    }

    return var_type;
}