// Define global variables
let isCropping = false; // Flag to track if cropping mode is enabled
let startX, startY, endX, endY; // Coordinates for cropping selection
let defaultWidth = 1400; // Default width for canvas
let defaultHeight = 786; // Default height for canvas
let currentImageUrl = ''; // URL of the currently loaded image
let rotationAngle = 0; // Rotation angle for the image
let brightnessValue = 100;
let saturationValue = 100;
let inversionValue = 0;
let grayscaleValue = 0;
let sharpnessValue = 100; // Added sharpness value
let isFlippedHorizontal = false;
let isFlippedVertical = false;

// Function to load images from URLs
function loadImages() {
  const imageUrlsInput = document.getElementById('imageUrls');
  const imageUrls = imageUrlsInput.value.split(/[\n]/).map(url => url.trim()).filter(url => url !== '');
  const imageList = document.getElementById('imageList');
  imageList.innerHTML = '';
  const ul = document.createElement('ul');
  imageList.appendChild(ul);
  let imageCounter = 1;

  // Create list items for each image URL
  imageUrls.forEach(url => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = imageCounter++ + '.';
    li.appendChild(span);
    li.appendChild(document.createTextNode(url));
    li.onclick = () => loadImage(url);
    ul.appendChild(li);
  });
}

// Function to load an image onto the canvas
function loadImage(url) {
  currentImageUrl = url;
  const mainCanvas = document.getElementById('mainCanvas');
  const ctx = mainCanvas.getContext('2d');
  const image = new Image();

  // Enable cross-origin image loading
  image.crossOrigin = 'Anonymous';

  // Load the image
  image.onload = function() {
    const aspectRatio = defaultWidth / defaultHeight;
    const imageAspectRatio = this.width / this.height;
    let destWidth, destHeight;

    // Calculate the dimensions to fit the image on the canvas while preserving aspect ratio
    if (imageAspectRatio > aspectRatio) {
      destWidth = defaultWidth;
      destHeight = defaultWidth / imageAspectRatio;
    } else {
      destWidth = defaultHeight * imageAspectRatio;
      destHeight = defaultHeight;
    }

    // Set canvas dimensions and draw the image
    mainCanvas.width = destWidth;
    mainCanvas.height = destHeight;
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    ctx.save(); // Save the current transformation matrix
    ctx.translate(mainCanvas.width / 2, mainCanvas.height / 2); // Translate to center of canvas
    ctx.rotate(rotationAngle * Math.PI / 180); // Rotate the canvas
    ctx.drawImage(image, -destWidth / 2, -destHeight / 2, destWidth, destHeight); // Draw the image
    ctx.restore(); // Restore the saved transformation matrix
  };

  // Handle image loading errors
  image.onerror = function() {
    loadImageAndDisplay(url);
  };

  // Set the image source
  image.src = url;
}


//Function to load CORS image.
function loadImageAndDisplay(url) {
  // URL of the Google Apps Script
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbyfRWdmsi19IdZuqYjBkVjE7ZAIUXe_WktSznYG-UOhZw_Ohe-BFUKHJYuCUk6KgyJ8Aw/exec';

  // Construct the full URL with the image URL as a parameter
  const fullUrl = scriptUrl + '?imageUrl=' + encodeURIComponent(url);

  // Make a GET request to the Google Apps Script URL
  fetch(fullUrl)
      .then(response => response.text())
      .then(dataUrl => {
          // Once the image is fetched, you can display it in your main canvas
          loadImage(dataUrl); // Call the existing function to display the image
      })
      .catch(error => console.error('Error fetching image:', error));
}

// Function to toggle cropping mode
function toggleCrop() {
  isCropping = !isCropping;
  if (isCropping) {
    // Enable mouse down event listener for cropping selection
    document.getElementById('mainCanvas').addEventListener('mousedown', handleMouseDown);
  } else {
    // Disable mouse down event listener for cropping selection
    document.getElementById('mainCanvas').removeEventListener('mousedown', handleMouseDown);
    clearSelectionBox();
  }
}

// Function to handle cropping
function handleCrop() {
  if (isCropping) {
    cropImage();
  }
}

// Event listener for crop button
document.getElementById('cropBtn').addEventListener('click', handleCrop);

// Event listener for Ctrl+C shortcut
document.addEventListener('keydown', function(event) {
  // Prevent default behavior of Ctrl+C when cropping mode is active
  if (event.ctrlKey && event.key === 'c' && isCropping) {
    event.preventDefault();
  }
  
  // Handle cropping
  if (event.ctrlKey && event.key === 'c') {
    handleCrop();
  }
});

// Function to handle mouse down event for cropping selection
function handleMouseDown(event) {
  const mainCanvas = document.getElementById('mainCanvas');
  const rect = mainCanvas.getBoundingClientRect();
  startX = event.clientX - rect.left;
  startY = event.clientY - rect.top;

  // Add event listeners for mouse move and mouse up events
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

// Function to handle mouse move event for cropping selection
function handleMouseMove(event) {
  const mainCanvas = document.getElementById('mainCanvas');
  const rect = mainCanvas.getBoundingClientRect();
  endX = event.clientX - rect.left;
  endY = event.clientY - rect.top;

  drawSelectionBox();
}

// Function to handle mouse up event for cropping selection
function handleMouseUp(event) {
  // Remove event listeners for mouse move and mouse up events
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);

  // Crop the image
  cropImage();
}

// Function to draw the cropping selection box on the canvas
function drawSelectionBox() {
  clearSelectionBox();

  const mainCanvas = document.getElementById('mainCanvas');
  const mainCtx = mainCanvas.getContext('2d');

  mainCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(startX - endX);
  const height = Math.abs(startY - endY);
  mainCtx.fillRect(x, y, width, height);
}

function saveImage() {
  const croppedCanvas = document.getElementById('croppedCanvas');
  const itemNameInput = document.getElementById('itemName').value;
  const storeDetailsInput = document.getElementById('storeDetails').value;
  const imageNameInput = document.getElementById('imageName');
  const imageNameValue = itemNameInput.replace(/\s+/g, '_') + '_' + storeDetailsInput.replace(/\s+/g, '_');

  if (!imageNameValue) {
    alert("Please enter a name for the image.");
    return;
  }

  const link = document.createElement('a');
  link.download = imageNameValue + '.jpeg';
  link.href = croppedCanvas.toDataURL('image/jpeg', 0.9); // Adjust quality settings
  link.click();
}

// Function to clear the cropping selection box from the canvas
function clearSelectionBox() {
  const mainCanvas = document.getElementById('mainCanvas');
  const mainCtx = mainCanvas.getContext('2d');
  mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
  loadImage(currentImageUrl); // Redraw the original image
}

// Function to crop the image based on the cropping selection
function cropImage() {
  if (!isCropping || !currentImageUrl) {
    return;
  }

  const mainCanvas = document.getElementById('mainCanvas');
  const mainCtx = mainCanvas.getContext('2d');
  const croppedCanvas = document.getElementById('croppedCanvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  // Get the selected resolution
  const resolution = document.querySelector('input[name="resolution"]:checked').value.split('x');
  const targetWidth = parseInt(resolution[0]);
  const targetHeight = parseInt(resolution[1]);

  // Calculate cropping coordinates and dimensions relative to the original image
  const sourceX = Math.min(startX, endX) * (mainCanvas.width / mainCanvas.offsetWidth) - (mainCanvas.width / 2) + (targetWidth / 2);
  const sourceY = Math.min(startY, endY) * (mainCanvas.height / mainCanvas.offsetHeight) - (mainCanvas.height / 2) + (targetHeight / 2);
  const width = Math.abs(startX - endX) * (mainCanvas.width / mainCanvas.offsetWidth);
  const height = Math.abs(startY - endY) * (mainCanvas.height / mainCanvas.offsetHeight);

  // Set cropped canvas dimensions
  croppedCanvas.width = targetWidth;
  croppedCanvas.height = targetHeight;

  // Clear the cropped canvas
  croppedCtx.clearRect(0, 0, croppedCanvas.width, croppedCanvas.height);

  // Calculate the position to center the stretched image within the cropped canvas
  const offsetX = (targetWidth - width) / 2;
  const offsetY = (targetHeight - height) / 2;

  // Draw the cropped portion of the image onto the cropped canvas
  if (width > 0 && height > 0) {
    croppedCtx.drawImage(
      mainCanvas, // Source image
      sourceX, sourceY, width, height, // Source cropping rectangle
      offsetX, offsetY, width, height // Destination rectangle (centered and fitting the selected resolution)
    );
  }

  // Apply filter to the cropped image
  applyFilterToCroppedImage();
}

// Function to apply filter to the cropped image
function applyFilterToCroppedImage() {
  // Get the selected filter and its value
  const selectedFilter = document.querySelector('.filter button.active');
  if (selectedFilter) {
    const filterId = selectedFilter.id;
    let filterValue = document.getElementById('filterSlider').value;

    switch (filterId) {
      case 'brightness':
        brightnessValue = filterValue;
        break;
      case 'saturation':
        saturationValue = filterValue;
        break;
      case 'inversion':
        inversionValue = filterValue;
        break;
      case 'grayscale':
        grayscaleValue = filterValue;
        break;
      case 'sharpness':
        sharpnessValue = filterValue; // Assign sharpness value
        break;
      default:
        break;
    }

    // Apply filters directly to the cropped canvas
    const croppedCanvas = document.getElementById('croppedCanvas');
    const croppedCtx = croppedCanvas.getContext('2d');
    croppedCtx.filter = `brightness(${brightnessValue}%) saturate(${saturationValue}%) invert(${inversionValue}%) grayscale(${grayscaleValue}%) contrast(${sharpnessValue}%)`; // Updated blur value

    // Redraw the cropped image
    drawCroppedImage();
  }
}

// Function to draw the cropped image without applying filters
function drawCroppedImage() {
  const croppedCanvas = document.getElementById('croppedCanvas');
  const mainCanvas = document.getElementById('mainCanvas');
  const mainCtx = mainCanvas.getContext('2d');
  const croppedCtx = croppedCanvas.getContext('2d');

  // Clear the cropped canvas
  croppedCtx.clearRect(0, 0, croppedCanvas.width, croppedCanvas.height);

  // Get the selected resolution
  const resolution = document.querySelector('input[name="resolution"]:checked').value.split('x');
  const resolutionWidth = parseInt(resolution[0]);
  const resolutionHeight = parseInt(resolution[1]);

  // Calculate dimensions and position
  const sourceX = Math.min(startX, endX) * (mainCanvas.width / mainCanvas.offsetWidth);
  const sourceY = Math.min(startY, endY) * (mainCanvas.height / mainCanvas.offsetHeight);
  const width = Math.abs(startX - endX) * (mainCanvas.width / mainCanvas.offsetWidth);
  const height = Math.abs(startY - endY) * (mainCanvas.height / mainCanvas.offsetHeight);
  const targetWidth = croppedCanvas.width;
  const targetHeight = croppedCanvas.height;

  // Calculate scale factors to fit the cropped image within the canvas
  const scaleX = targetWidth / width;
  const scaleY = targetHeight / height;

  // Draw the cropped image onto the cropped canvas with stretching
  if (width > 0 && height > 0) {
    croppedCtx.drawImage(
      mainCanvas, // Source image
      sourceX, sourceY, width, height, // Source cropping rectangle
      0, 0, resolutionWidth, resolutionHeight // Destination rectangle (stretched to fit the selected resolution)
    );
  }
}

// Function to reset filters
function resetFilter() {
  document.getElementById('filterSlider').value = 100;
  applyFilterToCroppedImage();
}

// Event listeners for filter options
document.querySelectorAll('.filter button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelector('.filter button.active').classList.remove('active');
    button.classList.add('active');
    // Update the filter slider value
    document.getElementById('filterSlider').value = eval(`${button.id}Value`);
    // Update the filter display value
    document.querySelector('.filter-info .value').textContent = `${document.getElementById('filterSlider').value}%`;
    applyFilterToCroppedImage();
  });
});

// Event listener for filter slider
document.getElementById('filterSlider').addEventListener('input', () => {
  const selectedFilter = document.querySelector('.filter button.active');
  if (selectedFilter) {
    // Update the corresponding filter value
    const filterId = selectedFilter.id;
    let filterValue = document.getElementById('filterSlider').value;
    switch (filterId) {
      case 'brightness':
        brightnessValue = filterValue;
        break;
      case 'saturation':
        saturationValue = filterValue;
        break;
      case 'inversion':
        inversionValue = filterValue;
        break;
      case 'grayscale':
        grayscaleValue = filterValue;
        break;
      case 'sharpness':
        sharpnessValue = filterValue; // Assign sharpness value
       break;
      default:
        break;
    }
    // Update the filter display value
    document.querySelector('.filter-info .value').textContent = `${filterValue}%`;
    applyFilterToCroppedImage();
  }
});

// Event listener for reset filter button
document.querySelector('.reset-filter').addEventListener('click', resetFilter);

// Initialize the cropping feature
toggleCrop();

// Event listener for the horizontal flip button
document.getElementById('horizontal').addEventListener('click', () => {
  flipCroppedImage('horizontal');
});

// Event listener for the vertical flip button
document.getElementById('vertical').addEventListener('click', () => {
  flipCroppedImage('vertical');
});


// Function to flip the cropped image
function flipCroppedImage(direction) {
  const croppedCanvas = document.getElementById('croppedCanvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  // Save the current filter settings
  const currentFilter = croppedCtx.filter;

  // Draw the cropped image onto a temporary canvas to preserve the filter settings
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = croppedCanvas.width;
  tempCanvas.height = croppedCanvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(croppedCanvas, 0, 0);

  // Toggle flip based on the direction
  if (direction === 'horizontal') {
    isFlippedHorizontal = !isFlippedHorizontal;
    croppedCtx.setTransform(isFlippedHorizontal ? -1 : 1, 0, 0, 1, 0, 0);
    croppedCtx.drawImage(tempCanvas, isFlippedHorizontal ? -croppedCanvas.width : 0, 0);
  } else if (direction === 'vertical') {
    isFlippedVertical = !isFlippedVertical;
    croppedCtx.setTransform(1, 0, 0, isFlippedVertical ? -1 : 1, 0, 0);
    croppedCtx.drawImage(tempCanvas, 0, isFlippedVertical ? -croppedCanvas.height : 0);
  }

  // Reapply filters to the flipped image
  croppedCtx.filter = currentFilter;

  // Reapply filters to maintain consistency
  applyFilterToCroppedImage();
}

function apply3DEffect() {
  const croppedCanvas = document.getElementById('croppedCanvas');
  const ctx = croppedCanvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, croppedCanvas.width, croppedCanvas.height);
  const data = imageData.data;
  const width = croppedCanvas.width;
  const height = croppedCanvas.height;

  // Define light source position
  const lightX = width * 0.75; // X-coordinate of light source (adjust as needed)
  const lightY = height * 0.25; // Y-coordinate of light source (adjust as needed)

  // Calculate the distance from each pixel to the light source
  for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
          // Calculate distance from current pixel to light source
          const distanceX = lightX - x;
          const distanceY = lightY - y;
          const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

          // Calculate brightness based on distance (inverse square law)
          const brightness = 1 / (distance * distance);

          // Apply brightness to RGB channels
          const index = (y * width + x) * 4;
          data[index] *= brightness; // Red
          data[index + 1] *= brightness; // Green
          data[index + 2] *= brightness; // Blue
      }
  }

  // Apply modified image data
  ctx.putImageData(imageData, 0, 0);
}


    // Event listener for rotation slider
    document.getElementById('rotationSlider').addEventListener('input', () => {
      rotationAngle = parseFloat(document.getElementById('rotationSlider').value);
      loadImage(currentImageUrl); // Reload the image with the new rotation angle
    });
