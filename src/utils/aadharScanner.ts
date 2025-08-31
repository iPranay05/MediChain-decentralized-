import Tesseract from 'tesseract.js';

// Mock interface for Tesseract.js
interface TesseractResult {
  data: {
    text: string;
  };
}

/**
 * Extracts Aadhar number from an image using OCR
 * @param imageFile - The image file containing the Aadhar card
 * @returns Promise resolving to the extracted Aadhar number or null if not found
 */
export async function extractAadharNumber(imageFile: File): Promise<string | null> {
  try {
    console.log('Starting OCR extraction process...');
    // Create a URL for the image file
    const imageUrl = URL.createObjectURL(imageFile);
    console.log('Image URL created:', imageUrl);
    
    // Log file information for debugging
    console.log('Processing file:', imageFile.name, 'Size:', Math.round(imageFile.size / 1024), 'KB', 'Type:', imageFile.type);
    
    // Recognize text from the image
    const result = await Tesseract.recognize(
      imageUrl,
      'eng', // English language
      {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          } else {
            console.log('OCR Status:', m.status);
          }
        },
      }
    );
    
    // Release the object URL
    URL.revokeObjectURL(imageUrl);
    
    // Extract the recognized text
    const text = result.data.text;
    console.log('OCR Extracted Text:', text);
    
    // Look for Aadhar number pattern (12 consecutive digits, possibly with spaces)
    const aadharRegex = /[0-9]{4}\s*[0-9]{4}\s*[0-9]{4}/g;
    const matches = text.match(aadharRegex);
    
    if (matches && matches.length > 0) {
      // Clean up the Aadhar number (remove spaces)
      const aadharNumber = matches[0].replace(/\s+/g, '');
      console.log('Aadhar number found:', aadharNumber);
      return aadharNumber;
    }
    
    // Try alternative pattern (just looking for 12 consecutive digits anywhere)
    const alternativeRegex = /\d{12}/g;
    const alternativeMatches = text.match(alternativeRegex);
    
    if (alternativeMatches && alternativeMatches.length > 0) {
      console.log('Aadhar number found (alternative pattern):', alternativeMatches[0]);
      return alternativeMatches[0];
    }
    
    console.log('No Aadhar number pattern found in the text');
    return null;
  } catch (error) {
    console.error('Error extracting Aadhar number:', error);
    return null;
  }
}

/**
 * Validates if a string is a valid Aadhar number
 * @param aadharNumber - The Aadhar number to validate
 * @returns boolean indicating if the Aadhar number is valid
 */
export function isValidAadharNumber(aadharNumber: string): boolean {
  // Basic validation: 12 digits
  const aadharRegex = /^[0-9]{12}$/;
  return aadharRegex.test(aadharNumber);
}
