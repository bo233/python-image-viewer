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
    // Validate imgName to prevent injection (must be valid Python identifier)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(imgName)) {
        vscode.window.showErrorMessage('Invalid variable name: ' + imgName);
        throw new Error('Invalid variable name');
    }
    
    // Convert various data types to PIL Image before saving
    let savePath = vscode.Uri.joinPath(saveDir, imgName + '.png');
    
    // Escape the path for Python (convert backslashes to forward slashes or escape them)
    let pythonPath = savePath.fsPath.replace(/\\/g, '/');
    
    // Build a Python script that handles conversion from various types to PIL Image
    // Note: We use a conversion helper function to avoid code duplication
    let conversionScript = `
try:
    from PIL import Image
    import numpy as np
    
    def convert_to_pil_image(arr):
        """Convert numpy array to PIL Image with proper shape and dtype handling"""
        # Valid channel counts: 1 (grayscale), 3 (RGB), 4 (RGBA)
        VALID_CHANNEL_COUNTS = [1, 3, 4]
        
        # Handle different array shapes
        if arr.ndim == 4:  # Batch dimension (NCHW or NHWC)
            arr = arr[0]  # Take first image in batch
        if arr.ndim == 3:
            # Check if it's CHW (channels first) format
            if arr.shape[0] in VALID_CHANNEL_COUNTS:
                arr = np.transpose(arr, (1, 2, 0))  # Convert to HWC
            if arr.shape[2] == 1:  # Single channel
                arr = arr[:, :, 0]
        # Normalize to 0-255 if needed
        if arr.dtype in [np.float32, np.float64, np.float16]:
            if arr.max() <= 1.0 and arr.min() >= 0.0:
                arr = (arr * 255).astype(np.uint8)
            else:
                arr = np.clip(arr, 0, 255).astype(np.uint8)
        elif arr.dtype != np.uint8:
            arr = arr.astype(np.uint8)
        return Image.fromarray(arr)
    
    _var = ${imgName}
    _img = None
    
    # Check if it's already a PIL Image
    if isinstance(_var, Image.Image):
        _img = _var
    # Check if it's a PyTorch tensor (check for is_cuda attribute for better detection)
    elif hasattr(_var, 'cpu') and hasattr(_var, 'numpy') and hasattr(_var, 'is_cuda'):
        # PyTorch tensor
        _arr = _var.detach().cpu().numpy()
        _img = convert_to_pil_image(_arr)
    # Check if it's a NumPy array
    elif isinstance(_var, np.ndarray):
        _img = convert_to_pil_image(_var)
    # Check if it's a list
    elif isinstance(_var, list):
        # Convert list to numpy array first
        _arr = np.array(_var)
        _img = convert_to_pil_image(_arr)
    
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