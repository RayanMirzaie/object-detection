import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0';

// Since we are not using local model, I'm too lazy for the binding :)
env.allowLocalModels = false;

// Reference the elements that we will need
const status = document.getElementById('status');
const fileUpload = document.getElementById('file-upload');
const imageContainer = document.getElementById('image-container');

// Create a new object detection pipeline
status.textContent = 'Loading model...';
const detector = await pipeline('object-detection', 'Xenova/detr-resnet-50');
status.textContent = 'Ready';

fileUpload.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();

    // Set up a callback when the file is loaded
    reader.onload = function (e2) {
        imageContainer.innerHTML = '';
        const image = document.createElement('img');
        image.src = e2.target.result;
        imageContainer.appendChild(image);
        detect(image);
    };
    reader.readAsDataURL(file);
});


// Detect objects in the image
async function detect(img) {
    status.textContent = 'Analysing...';
    const output = await detector(img.src, {
        threshold: 0.5,
        percentage: true,
    });
    status.textContent = '';
    output.forEach(renderBox);
    console.log(output);
}

// Render a bounding box and label on the image
let labelOffsets = {};  // Keep track of label positions to check for overlap
function renderBox({ box, label, score }) {
    const { xmax, xmin, ymax, ymin } = box;
    const color = '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, 0);

    const boxElement = document.createElement('div');
    boxElement.className = 'bounding-box';
    Object.assign(boxElement.style, {
        borderColor: color,
        left: 100 * xmin + '%',
        top: 100 * ymin + '%',
        width: 100 * (xmax - xmin) + '%',
        height: 100 * (ymax - ymin) + '%',
    })

    const labelElement = document.createElement('span');
    labelElement.textContent = label + ' (' + (score * 100).toFixed(2) + '%)';  // Convert score to percentage
    labelElement.className = 'bounding-box-label';
    labelElement.style.backgroundColor = color;

    // Adjust label position to prevent overlap
    const labelKey = Math.floor(100 * ymin);
    labelOffsets[labelKey] = (labelOffsets[labelKey] || 0) + 1; 
    const labelOffset = labelOffsets[labelKey] * 20;
    labelElement.style.top = (100 * ymin - labelOffset) + 'px';

    boxElement.appendChild(labelElement);
    imageContainer.appendChild(boxElement);
}
