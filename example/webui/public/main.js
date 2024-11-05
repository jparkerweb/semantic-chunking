// Load sample text on page load
fetch('sample.txt')
    .then(response => response.text())
    .then(text => {
        document.getElementById('documentText').value = text;
    })
    .catch(error => console.error('Error loading sample text:', error));

// Update range input displays
document.querySelectorAll('input[type="range"]').forEach(input => {
    const display = input.nextElementSibling;
    input.addEventListener('input', () => {
        display.textContent = input.value;
    });
});

// Add this after the range input display setup
const combineChunksToggle = document.getElementById('combineChunks');
const dependentControls = document.querySelectorAll('.depends-on-combine-chunks');

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

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        // Show loading state
        form.querySelector('button[type="submit"]').disabled = true;
        form.querySelector('button[type="submit"]').textContent = 'Processing...';
        resultsJson.style.display = 'none';
        spinner.classList.add('visible');
        resultsContainer.classList.remove('hidden');
        resultsFooter.classList.remove('visible');
        
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
        
        // Make API request
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
        spinner.classList.remove('visible');
        resultsJson.style.display = 'block';
        resultsJson.textContent = JSON.stringify(result, null, 2);
        resultsFooter.classList.add('visible');
        
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
        } else {
            document.getElementById('chunkCount').textContent = '';
            document.getElementById('avgTokenLength').textContent = '';
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
        alert(`Error: ${error.message}`);
        resultsJson.textContent = '';
        resultsFooter.classList.remove('visible');
        spinner.classList.remove('visible');
        resultsJson.style.display = 'block';
    } finally {
        // Reset form state
        form.querySelector('button[type="submit"]').disabled = false;
        form.querySelector('button[type="submit"]').textContent = 'Process Text';
    }
}); 