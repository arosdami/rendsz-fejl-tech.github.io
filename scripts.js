// DOM Elements
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const uploadButton = document.getElementById('uploadButton');
const folderSelect = document.getElementById('folderSelect');
const fileList = document.getElementById('fileList');
const filePreviewModal = new bootstrap.Modal(document.getElementById('filePreviewModal'));
const previewModalTitle = document.getElementById('previewModalTitle');
const previewModalBody = document.getElementById('previewModalBody');
const downloadFileBtn = document.getElementById('downloadFileBtn');

// GitHub repository details
const githubRepo = 'arosdami/rendsz-fejl-tech.github.io';
const apiBaseUrl = `https://api.github.com/repos/${githubRepo}/contents`;

// Initialize Dropzone
Dropzone.autoDiscover = false;
const myDropzone = new Dropzone("#githubUploader", {
    url: "/upload", // This would be replaced with your actual upload endpoint
    paramName: "file",
    maxFilesize: 10, // MB
    acceptedFiles: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip",
    addRemoveLinks: true,
    autoProcessQueue: false,
    parallelUploads: 5,
    dictDefaultMessage: "Húzz ide fájlokat a feltöltéshez",
    dictFallbackMessage: "A böngészője nem támogatja a fájlok drag & drop feltöltését",
    dictFileTooBig: "A fájl túl nagy ({{filesize}}MB). Maximális méret: {{maxFilesize}}MB.",
    dictInvalidFileType: "Nem támogatott fájlformátum",
    dictResponseError: "Szerverhiba {{statusCode}}",
    dictCancelUpload: "Feltöltés visszavonása",
    dictUploadCanceled: "Feltöltés visszavonva",
    dictRemoveFile: "Fájl eltávolítása",
    dictMaxFilesExceeded: "Nem tölthetsz fel több fájlt"
});

// Event Listeners
toggleSidebarBtn.addEventListener('click', toggleSidebar);
uploadButton.addEventListener('click', processUpload);
document.addEventListener('DOMContentLoaded', loadFilesFromGitHub);

// Functions
function toggleSidebar() {
    sidebar.classList.toggle('sidebar-collapsed');
    mainContent.classList.toggle('main-content-expanded');
}

function processUpload() {
    const selectedFolder = folderSelect.value;
    if (myDropzone.getQueuedFiles().length === 0) {
        alert('Nincsenek fájlok a feltöltéshez!');
        return;
    }
    
    // In a real implementation, you would send files to your server
    // which would then use the GitHub API to upload them
    alert(`Feltöltés a ${selectedFolder} mappába készül... (DEMO)`);
    
    // For demo purposes, we'll just simulate the upload
    setTimeout(() => {
        myDropzone.removeAllFiles(true);
        alert('Feltöltés sikeres!');
        loadFilesFromGitHub();
    }, 2000);
}

async function loadFilesFromGitHub() {
    try {
        fileList.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border text-primary" role="status"></div></td></tr>';
        
        // Fetch all folders
        const folders = ['H1', 'H2', 'H3', 'H4', 'H5'];
        let allFiles = [];
        
        // Get files from each folder
        for (const folder of folders) {
            try {
                const response = await axios.get(`${apiBaseUrl}/${folder}`);
                const files = response.data.map(file => ({
                    name: file.name,
                    path: file.path,
                    size: formatFileSize(file.size),
                    download_url: file.download_url,
                    html_url: file.html_url,
                    folder: folder,
                    last_modified: new Date(file.last_modified || file.created_at).toLocaleDateString()
                }));
                allFiles = [...allFiles, ...files];
            } catch (error) {
                console.error(`Error loading files from ${folder}:`, error);
            }
        }
        
        // Display files in table
        displayFiles(allFiles);
    } catch (error) {
        console.error('Error loading files:', error);
        fileList.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Hiba történt a fájlok betöltése közben</td></tr>';
    }
}

function displayFiles(files) {
    if (files.length === 0) {
        fileList.innerHTML = '<tr><td colspan="5" class="text-center">Nincsenek fájlok a repository-ban</td></tr>';
        return;
    }
    
    fileList.innerHTML = files.map(file => `
        <tr>
            <td>${file.name}</td>
            <td>${file.folder}</td>
            <td>${file.size}</td>
            <td>${file.last_modified}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary file-action-btn preview-btn" data-url="${file.download_url}" data-name="${file.name}">
                    <i class="fas fa-eye"></i>
                </button>
                <a href="${file.download_url}" class="btn btn-sm btn-outline-success file-action-btn" download>
                    <i class="fas fa-download"></i>
                </a>
                <a href="${file.html_url}" target="_blank" class="btn btn-sm btn-outline-info file-action-btn">
                    <i class="fas fa-external-link-alt"></i>
                </a>
            </td>
        </tr>
    `).join('');
    
    // Add event listeners to preview buttons
    document.querySelectorAll('.preview-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const url = e.currentTarget.getAttribute('data-url');
            const name = e.currentTarget.getAttribute('data-name');
            previewFile(url, name);
        });
    });
}

function previewFile(url, name) {
    previewModalTitle.textContent = name;
    previewModalBody.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p>Fájl betöltése...</p></div>';
    downloadFileBtn.href = url;
    
    // Check file type to determine how to preview it
    const extension = name.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
        // Image preview
        previewModalBody.innerHTML = `<img src="${url}" class="img-fluid" alt="${name}">`;
    } else if (['pdf'].includes(extension)) {
        // PDF preview (using PDF.js would be better in a real implementation)
        previewModalBody.innerHTML = `
            <div class="alert alert-info">
                A PDF előnézete nem elérhető ebben a demóban. <a href="${url}" target="_blank">Megnyitás új lapon</a>
            </div>
        `;
    } else if (['txt', 'md'].includes(extension)) {
        // Text file preview
        axios.get(url)
            .then(response => {
                previewModalBody.innerHTML = `<pre>${response.data}</pre>`;
            })
            .catch(error => {
                previewModalBody.innerHTML = `
                    <div class="alert alert-danger">
                        Nem sikerült betölteni a fájlt: ${error.message}
                    </div>
                `;
            });
    } else {
        // Unsupported file type
        previewModalBody.innerHTML = `
            <div class="alert alert-warning">
                A fájlformátum előnézete nem támogatott. <a href="${url}" download>Letöltés</a>
            </div>
        `;
    }
    
    filePreviewModal.show();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}
