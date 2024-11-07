// Load sample text on page load
fetch('sample.txt')
    .then(response => response.text())
    .then(text => {
        document.getElementById('documentText').value = text;
    })
    .catch(error => console.error('Error loading sample text:', error));

// Load and populate model options
fetch('models.json')
    .then(response => response.json())
    .then(data => {
        const select = document.getElementById('onnxEmbeddingModel');
        data.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.value;
            option.textContent = model.label;
            select.appendChild(option);
        });
    })
    .catch(error => console.error('Error loading models:', error));

// Update range input displays
document.querySelectorAll('input[type="range"]').forEach(input => {
    const display = input.nextElementSibling;
    
    // Create inner elements if they don't exist
    if (!display.querySelector('.number')) {
        const number = document.createElement('span');
        number.className = 'number';
        const description = document.createElement('span');
        description.className = 'description';
        display.appendChild(number);
        display.appendChild(description);
    }

    // Update similarity display
    function updateSimilarityDisplay(value) {
        const number = display.querySelector('.number');
        const description = display.querySelector('.description');
        
        // Only update similarity descriptions for relevant sliders
        const similaritySliders = [
            'similarityThreshold',
            'combineChunksSimilarityThreshold',
            'dynamicThresholdLowerBound',
            'dynamicThresholdUpperBound'
        ];
        
        if (similaritySliders.includes(input.id)) {
            const val = parseFloat(value);
            let className, text;
            
            if (val < 0.5) {
                className = 'similarity-low';
                text = 'low similarity';
            } else if (val <= 0.7) {
                className = 'similarity-moderate';
                text = 'moderately similar';
            } else {
                className = 'similarity-high';
                text = 'very similar';
            }
            
            number.className = 'number ' + className;
            number.textContent = val.toFixed(3);
            description.className = 'description ' + className;
            description.textContent = text;
        } else {
            number.textContent = value;
            description.textContent = '';
        }
    }

    // Initial update
    updateSimilarityDisplay(input.value);

    // Update on change
    input.addEventListener('input', (e) => updateSimilarityDisplay(e.target.value));
});

const combineChunksToggle = document.getElementById('combineChunks');
const dependentControls = document.querySelectorAll('.depends-on-combine-chunks');

// Update dependent controls
function updateDependentControls() {
    const isEnabled = combineChunksToggle.checked;
    dependentControls.forEach(control => {
        if (isEnabled) {
            // Show controls
            control.style.display = 'block';
            // Use setTimeout to ensure display: block takes effect first
            setTimeout(() => {
                control.classList.remove('hidden');
                const inputs = control.querySelectorAll('input');
                inputs.forEach(input => input.disabled = false);
            }, 10);
        } else {
            // Hide controls
            control.classList.add('hidden');
            const inputs = control.querySelectorAll('input');
            inputs.forEach(input => input.disabled = true);
            // Remove display: none after transition completes
            control.addEventListener('transitionend', function handler() {
                if (!combineChunksToggle.checked) {
                    control.style.display = 'none';
                }
                control.removeEventListener('transitionend', handler);
            });
        }
    });
}

// Initial state
updateDependentControls();

// Listen for changes
combineChunksToggle.addEventListener('change', updateDependentControls);

// Form submission handler
const form = document.getElementById('chunkForm');
const resultsContainer = document.getElementById('results');
const resultsJson = document.getElementById('resultsJson');
const downloadButton = document.getElementById('downloadButton');
const resultsFooter = document.querySelector('.results-footer');

// Clear results and hide download button initially
resultsJson.textContent = '';
resultsFooter.classList.remove('visible');

// Add spinner element reference
const spinner = document.createElement('div');
spinner.className = 'spinner';
resultsJson.parentNode.insertBefore(spinner, resultsJson);

// Process form handler
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const downloadButton = document.getElementById('downloadButton');
    const defaultMessage = document.getElementById('defaultMessage');
    
    try {
        submitButton.disabled = true;
        downloadButton.disabled = true;
        spinner.classList.add('visible');
        resultsJson.style.display = 'none';
        defaultMessage.style.display = 'none';
        
        // Get form data and convert checkbox values to boolean
        const formData = new FormData(form);
        const data = Object.fromEntries(
            Array.from(formData.entries()).map(([key, value]) => {
                // Convert checkbox values to boolean
                if (form.elements[key].type === 'checkbox') {
                    return [key, form.elements[key].checked];
                }
                return [key, value];
            })
        );
        
        const startTime = performance.now();
        const response = await fetch('/api/chunk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || 'Failed to process text');
        }
        
        // Display results
        const result = await response.json();
        const endTime = performance.now();
        const processingTime = ((endTime - startTime) / 1000).toFixed(2);
        
        spinner.classList.remove('visible');
        defaultMessage.style.display = 'none';
        resultsJson.style.display = 'block';

        // Create code element and set content safely
        const codeElement = document.createElement('code');
        codeElement.className = 'language-json';
        codeElement.textContent = JSON.stringify(result, null, 2);
        resultsJson.textContent = ''; // Clear existing content
        resultsJson.appendChild(codeElement);
        hljs.highlightElement(codeElement);

        // Enable download button if we have results
        downloadButton.disabled = false;

        // Calculate and display stats
        if (result.length > 0) {
            const numChunks = result[0].number_of_chunks;
            document.getElementById('chunkCount').textContent = `Chunks: ${numChunks}`;
            
            if (result[0].token_length !== undefined) {
                const avgTokens = Math.round(
                    result.reduce((sum, chunk) => sum + chunk.token_length, 0) / result.length
                );
                document.getElementById('avgTokenLength').textContent = `Avg Tokens: ${avgTokens}`;
            } else {
                document.getElementById('avgTokenLength').textContent = '';
            }

            document.getElementById('processingTime').textContent = `Total Time: ${processingTime}s`;
        } else {
            document.getElementById('chunkCount').textContent = '';
            document.getElementById('avgTokenLength').textContent = '';
            document.getElementById('processingTime').textContent = '';
        }
        
        // Enable download
        downloadButton.onclick = () => {
            const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'chunks.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };
        
    } catch (error) {
        console.error('Error:', error);
        let errorMessage = error.message;
        
        if (errorMessage.includes('Could not locate file:')) {
            errorMessage += '<br><br>Some models may not have both a quantized & non-quantized version,';
            errorMessage += '<br>please toggle this option and try again, or choose a different model';
        }
        
        showToast(errorMessage);
        downloadButton.disabled = true;
        spinner.classList.remove('visible');
        resultsJson.style.display = 'block';
        
        const codeElement = document.createElement('code');
        codeElement.className = 'language-json';
        codeElement.textContent = JSON.stringify({ error: error.message }, null, 2);
        resultsJson.textContent = ''; // Clear existing content
        resultsJson.appendChild(codeElement);
        hljs.highlightElement(codeElement);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Process Text';
    }
});

// Initialize download button as disabled
document.getElementById('downloadButton').disabled = true;

// Document buttons handler
document.querySelectorAll('.document-buttons button').forEach(button => {
    button.addEventListener('click', async () => {
        const fileType = button.dataset.file;
        const fileName = `${fileType}.txt`;
        
        try {
            const response = await fetch(fileName);
            if (!response.ok) throw new Error(`Failed to load ${fileName}`);
            
            const text = await response.text();
            document.getElementById('documentText').value = text;
            document.getElementById('documentName').value = `${fileType} text`;
        } catch (error) {
            console.error('Error loading text file:', error);
            showToast(`Failed to load ${fileName}`);
        }
    });
});

const modal = document.getElementById('codeModal');
const getCodeBtn = document.getElementById('getCodeButton');
const closeBtn = document.querySelector('.close');
const copyBtn = document.getElementById('copyCode');
const codeExample = document.querySelector('#codeExample code');

// Get Code button handler
getCodeBtn.onclick = () => {
    // Get all form data and properly handle checkbox values
    const formData = {};
    const formElements = form.elements;
    
    for (let element of formElements) {
        if (element.type === 'checkbox') {
            formData[element.name] = element.checked;
        } else if (element.name) {  // Only process elements with names
            formData[element.name] = element.value;
        }
    }
    
    // No need for additional processing in generateCode since we're already
    // getting the actual boolean values here
    codeExample.textContent = generateCode(formData);
    modal.style.display = "block";
    // Clear the highlighted state before highlighting again
    delete codeExample.dataset.highlighted;
    hljs.highlightElement(codeExample);
};

// Generate Code function
function generateCode(formData) {
    // No need to convert checkbox values since they're already booleans
    return `// import the semantic-chunking library
import { chunkit } from 'semantic-chunking';

// define the documents array to be chunked
const documents = [
    {
        document_name: "${formData.documentName}",
        document_text: "Document text goes here.",
    }
];

// call the chunkit function with the documents array and an options object
const myChunks = await chunkit(
    documents,
    {
        logging: ${formData.logging},
        maxTokenSize: ${formData.maxTokenSize},
        similarityThreshold: ${formData.similarityThreshold},
        dynamicThresholdLowerBound: ${formData.dynamicThresholdLowerBound},
        dynamicThresholdUpperBound: ${formData.dynamicThresholdUpperBound},
        numSimilaritySentencesLookahead: ${formData.numSimilaritySentencesLookahead},
        combineChunks: ${formData.combineChunks},
        combineChunksSimilarityThreshold: ${formData.combineChunksSimilarityThreshold},
        onnxEmbeddingModel: "${formData.onnxEmbeddingModel}",
        onnxEmbeddingModelQuantized: ${formData.onnxEmbeddingModelQuantized},
        localModelPath: "./models",
        modelCacheDir: "./models",
        returnEmbedding: ${formData.returnEmbedding},
        returnTokenLength: ${formData.returnTokenLength},
        chunkPrefix: "${formData.chunkPrefix}",
        excludeChunkPrefixInResults: ${formData.excludeChunkPrefixInResults},
    }
);

// log the results
console.log(myChunks);`;
}

// Close Modal button handler
closeBtn.onclick = () => {
    modal.style.display = "none";
};

// Close Modal on click outside
window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
};

// Copy Code button handler
copyBtn.onclick = () => {
    navigator.clipboard.writeText(codeExample.textContent)
        .then(() => {
            copyBtn.textContent = "Copied!";
            showToast('Code copied to clipboard!', 'success');
            setTimeout(() => {
                copyBtn.textContent = "Copy Code";
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy:', err);
            showToast('Failed to copy code to clipboard');
        });
};

// Close Modal button handler
const closeModalBtn = document.getElementById('closeModal');
closeModalBtn.onclick = () => {
    modal.style.display = "none";
};

// Toast functionality
function showToast(message, type = 'error', duration = 7000) {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;

    // Clear any existing toasts
    toastContainer.innerHTML = '';
    toastContainer.classList.add('visible');
    toastContainer.appendChild(toast);

    // Function to dismiss toast
    function dismissToast() {
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => {
            toastContainer.classList.remove('visible');
            toastContainer.innerHTML = '';
        }, 300);
    }

    // Add click handlers
    toastContainer.onclick = dismissToast;
    toast.onclick = (e) => {
        e.stopPropagation(); // Prevent double-firing with container click
        dismissToast();
    };

    // Auto dismiss after duration
    const timeoutId = setTimeout(dismissToast, duration);

    // Clear timeout if manually dismissed
    toastContainer.addEventListener('click', () => {
        clearTimeout(timeoutId);
    }, { once: true });
}

// Add this with your other event listeners
document.querySelector('.info-icon').addEventListener('click', () => {
    showToast('More model choices can be added by updating the "models.json" file in the "webui" directory.', 'info', 7000);
});

// Add after other initialization code
const resultsContent = document.querySelector('.results-content');

// Create and add the resize toggle button
const processingTimeSpan = document.getElementById('processingTime');

// Create and add the resize toggle button
const resizeToggle = document.createElement('button');
resizeToggle.className = 'resize-toggle';
resizeToggle.innerHTML = `
    <svg viewBox="0 0 24 24">
        <path d="M17 8.5L20 11.5L17 14.5M7 8.5L4 11.5L7 14.5M5.5 11.5H18.5" 
              stroke="white" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"
              fill="none"/>
    </svg>
`;
resizeToggle.title = "Toggle text wrapping";
processingTimeSpan.parentNode.insertBefore(resizeToggle, processingTimeSpan.nextSibling);

// Add click handler
resizeToggle.addEventListener('click', () => {
    resultsJson.classList.toggle('wrapped');
    resizeToggle.classList.toggle('wrapped');
});