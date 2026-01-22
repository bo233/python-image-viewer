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
    // Convert various data types to PIL Image before saving
    let savePath = vscode.Uri.joinPath(saveDir, imgName + '.png');
    
    // Escape the path for Python (convert backslashes to forward slashes or escape them)
    let pythonPath = savePath.fsPath.replace(/\\/g, '/');
    
    // Build a Python script that handles conversion from various types to PIL Image
    let conversionScript = `
try:
    from PIL import Image
    import numpy as np
    _var = ${imgName}
    _img = None
    
    # Check if it's already a PIL Image
    if isinstance(_var, Image.Image):
        _img = _var
    # Check if it's a PyTorch tensor
    elif hasattr(_var, 'cpu') and hasattr(_var, 'numpy'):
        # PyTorch tensor
        _arr = _var.detach().cpu().numpy()
        # Handle different tensor shapes
        if _arr.ndim == 4:  # Batch dimension
            _arr = _arr[0]  # Take first image in batch
        if _arr.ndim == 3:
            # Check if it's CHW (channels first) format
            if _arr.shape[0] in [1, 3, 4]:
                _arr = np.transpose(_arr, (1, 2, 0))  # Convert to HWC
            if _arr.shape[2] == 1:  # Single channel
                _arr = _arr[:, :, 0]
        # Normalize to 0-255 if needed
        if _arr.dtype == np.float32 or _arr.dtype == np.float64:
            if _arr.max() <= 1.0:
                _arr = (_arr * 255).astype(np.uint8)
            else:
                _arr = _arr.astype(np.uint8)
        _img = Image.fromarray(_arr)
    # Check if it's a NumPy array
    elif isinstance(_var, np.ndarray):
        _arr = _var
        # Handle different array shapes
        if _arr.ndim == 4:  # Batch dimension
            _arr = _arr[0]
        if _arr.ndim == 3:
            # Check if it's CHW (channels first) format
            if _arr.shape[0] in [1, 3, 4]:
                _arr = np.transpose(_arr, (1, 2, 0))
            if _arr.shape[2] == 1:  # Single channel
                _arr = _arr[:, :, 0]
        # Normalize to 0-255 if needed
        if _arr.dtype == np.float32 or _arr.dtype == np.float64:
            if _arr.max() <= 1.0:
                _arr = (_arr * 255).astype(np.uint8)
            else:
                _arr = _arr.astype(np.uint8)
        _img = Image.fromarray(_arr)
    # Check if it's a list
    elif isinstance(_var, list):
        # Convert list to numpy array first
        _arr = np.array(_var)
        # Handle different array shapes
        if _arr.ndim == 4:  # Batch dimension
            _arr = _arr[0]
        if _arr.ndim == 3:
            # Check if it's CHW (channels first) format
            if _arr.shape[0] in [1, 3, 4]:
                _arr = np.transpose(_arr, (1, 2, 0))
            if _arr.shape[2] == 1:  # Single channel
                _arr = _arr[:, :, 0]
        # Normalize to 0-255 if needed
        if _arr.dtype == np.float32 or _arr.dtype == np.float64:
            if _arr.max() <= 1.0:
                _arr = (_arr * 255).astype(np.uint8)
            else:
                _arr = _arr.astype(np.uint8)
        _img = Image.fromarray(_arr)
    
    if _img is not None:
        _img.save('${pythonPath}')
        'SUCCESS'
    else:
        'ERROR: Unsupported type'
except Exception as e:
    f'ERROR: {str(e)}'
`;
    
    let result = await evalExpr(conversionScript, debugSession, frameId);
    console.log(result);
    
    if (result && result.result && result.result.includes('ERROR')) {
        vscode.window.showErrorMessage('Failed to convert image: ' + result.result);
        throw new Error(result.result);
    }
    
    return savePath;
}