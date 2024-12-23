
document.addEventListener('DOMContentLoaded', function() {
    var editor = new FroalaEditor('#froala-editor', {
        heightMin: 300, // Set the minimum height of the editor
        placeholderText: 'Start writing your content...',
        
        toolbarButtons: [
            'bold', 'italic', 'underline', 'strikeThrough', 'heading',
            'fontFamily', 'fontSize', 'color', 'emoticons',
            'inlineStyle', 'paragraphFormat', 'paragraphStyle', 'align', 
            'formatOL', 'formatUL', 'outdent', 'indent', 'undo', 'redo', 
            'clear', 'insertTable', 'link', 'image', 'video', 'audio', 
            'file', 'insertHR', 'fullscreen', 'quote', 'specialCharacters', 
            'html', 'codeView', 'print', 'spellChecker', 'help'
        ],
        toolbarButtonsMD: [
            'bold', 'italic', 'underline', 'strikeThrough', 'heading',
            'fontFamily', 'fontSize', 'color', 'emoticons',
            'inlineStyle', 'paragraphFormat', 'paragraphStyle', 'align',
            'formatOL', 'formatUL', 'outdent', 'indent', 'undo', 'redo',
            'clear', 'insertTable', 'link', 'image', 'video', 'audio',
            'file', 'insertHR', 'fullscreen', 'quote', 'specialCharacters',
            'html', 'codeView', 'print', 'spellChecker', 'help'
        ],
        
        toolbarButtonsSM: [
            'bold', 'italic', 'underline', 'strikeThrough', 'heading',
            'fontFamily', 'fontSize', 'color', 'emoticons',
            'inlineStyle', 'paragraphFormat', 'paragraphStyle', 'align',
            'formatOL', 'formatUL', 'outdent', 'indent', 'undo', 'redo',
            'clear', 'insertTable', 'link', 'image', 'video', 'audio',
            'file', 'insertHR', 'fullscreen', 'quote', 'specialCharacters',
            'html', 'codeView', 'print', 'spellChecker', 'help'
        ],
        
        toolbarButtonsXS: [
            'bold', 'italic', 'underline', 'strikeThrough', 'heading',
            'fontFamily', 'fontSize', 'color', 'emoticons',
            'inlineStyle', 'paragraphFormat', 'paragraphStyle', 'align',
            'formatOL', 'formatUL', 'outdent', 'indent', 'undo', 'redo',
            'clear', 'insertTable', 'link', 'image', 'video', 'audio',
            'file', 'insertHR', 'fullscreen', 'quote', 'specialCharacters',
            'html', 'codeView', 'print', 'spellChecker', 'help'
        ],
        
    
        // Configuration for heading dropdown
        headingTags: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'], // Optional: defines the heading options
        headingStyle: {
            'H1': 'font-size: 32px; font-weight: bold;',
            'H2': 'font-size: 28px; font-weight: bold;',
            'H3': 'font-size: 24px; font-weight: bold;',
            'H4': 'font-size: 20px; font-weight: bold;',
            'H5': 'font-size: 18px; font-weight: bold;',
            'H6': 'font-size: 16px; font-weight: bold;',
        },
        
        headingDropdown: true, // Dropdown for selecting headings in the toolbar
    
        // Custom fonts and font size
        fontFamily: ['Arial', 'Courier', 'Georgia', 'Impact', 'Times New Roman'],
        fontSize: ['8', '10', '12', '14', '18', '24', '36'],
    
        // Text Color and Background Color
        textColor: ['#000000', '#FF5733', '#33FF57', '#3357FF'],
        backgroundColor: ['#FFFFFF', '#FF5733', '#33FF57', '#3357FF'],
    
        // Special buttons in toolbar
        emoticonsButtons: ['smile', 'heart', 'thumbs-up', 'angry'],
    
        // Paragraph format and alignment
        paragraphDefaultSelection: 'Paragraph',
        paragraphStyle: {
            'font-weight': 'bold',
            'font-style': 'italic'
        },
        align: ['left', 'center', 'right', 'justify'],
        inlineStyle: ['bold', 'italic', 'underline', 'strikeThrough'],
    
        // List formatting
        formatOL: true,   // Ordered List
        formatUL: true,   // Unordered List
        outdent: true,    // Decrease indentation
        indent: true,     // Increase indentation
    
        // Miscellaneous options
        undo: true,       // Undo button enabled
        redo: true,       // Redo button enabled
        clear: true,      // Clear content button
        insertTable: true,// Insert Table button
        link: true,       // Insert Link button
        image: true,      // Insert Image button
        video: true,      // Insert Video button
        audio: true,      // Insert Audio button
        file: true,       // Insert File button
        insertHR: true,   // Insert Horizontal Rule button
        fullscreen: true, // Fullscreen mode enabled
        quote: true,      // Quote button enabled
        specialCharacters: true, // Special Characters button enabled
        html: true,       // HTML view button enabled
        codeView: true,   // Code view button enabled
        print: true,      // Print button enabled
        spellChecker: true, // Spell checker enabled
        help: true,       // Help button enabled
    
        // Advanced options
        linkAlwaysBlank: true,  // Always open links in a new tab
        linkNoOpener: true,    // Add rel="noopener" to links
        imageManagerLoadURL: '/your-server/image/load', // Load images from server
        imageManagerDeleteURL: '/your-server/image/delete', // Delete image from server
    
        // File upload options
        fileUpload: true,   // File upload enabled
        fileUploadURL: '/your-server/upload-file', // File upload URL
    
        // Image upload options
        imageUpload: true,   // Image upload enabled
        imageUploadURL: '/your-server/upload-image',  // Image upload URL
        imageUploadParams: { param1: 'value1' },  // Optional extra params for image upload
    
        // Video upload options
        videoUpload: true,   // Video upload enabled
        videoUploadURL: '/your-server/upload-video', // Video upload URL
    
        // Audio upload options
        audioUpload: true,   // Audio upload enabled
        audioUploadURL: '/your-server/upload-audio', // Audio upload URL
    
        // Enable spell checker
        spellcheck: true,   // Enable browser spellchecker
        spellCheckerLang: 'en',  // Default spell checker language
    
        // Allows to paste as plain text
        pastePlainText: true, // Paste as plain text enabled
    
        // Configuration for inline editing
        inlineMode: false, // Whether the editor should be inline or not
    
        // Language and direction configuration
        language: 'en',  // Language for the editor
        direction: 'ltr', // Direction of text (left-to-right or right-to-left)
    
        // Allow content dragging
        dragable: true,  // Enable content dragging within editor
    
        // Cleanup HTML
        cleanup: true,   // Automatically clean up HTML on paste
    
        // Custom link attributes
        linkDefaultTarget: '_blank',  // Default target for links
        linkTarget: true,  // Allow setting the target for links
    
        // Enable/disable right-click
        disableRightClick: true,  // Disable right-click in editor
    
        // Enable/disable keyboard shortcuts
        keyboardNavigation: true,  // Enable keyboard navigation
        shortcuts: true,  // Enable keyboard shortcuts (like ctrl+c, ctrl+v)
    
        // Enabling / Disabling specific features
        fullscreen: true, // Enable fullscreen editing
        codeView: true,   // Enable viewing HTML code
        imageManager: true,  // Enable image manager (browse uploaded images)
    
        // Filemanager integration options
        fileManager: true,  // File manager enabled
        fileManagerLoadURL: '/your-server/file-manager/load',  // File manager load URL
        fileManagerDeleteURL: '/your-server/file-manager/delete',  // File manager delete URL
    
        // Other custom configurations
        toolbarSticky: true, // Sticky toolbar
        toolbarStickyOffset: 10, // Sticky toolbar offset from top of the page
        modalStyles: 'width:80%;height:70%', // Modal dialog box styles
    
        // Events
        events: {
            'froalaEditor.initialized': function(e, editor) {
                console.log('Froala Editor initialized');
            }
        }
    });
    

// Function to prepare data and send it to the server
function prepareDataAndSend() {
    if (!editor) {
        console.error('Froala editor is not initialized.');
        return;
    }

    // Get the content from the Froala editor
    const editorContent = editor.html.get(); // This returns the HTML content
    const title = document.getElementById('article-title').value;
    const abstract = document.querySelector('input[name="abstract"]').value;
    const category_id = document.querySelector('select[name="category_id"]').value;
    const premium = document.querySelector('input[name="premium"]').checked ? true : false;



    // Log the content to check if it's correct
    console.log('Editor content:', editorContent);
    console.log('Title:', title);
    console.log('Abstract:', abstract);


    const articleData = {
        title: title,             // Title from the form
        abstract: abstract,       // Abstract from the form
        editorContent: editorContent, // Content from the Froala editor
        category_id: category_id,           // Example category ID
        author_id: 1,             // Example author ID
        status: 'draft',          // Default status
        featured_image: null,     // Optional featured image, can be null or added as needed
        premium:premium
    };

    // Send the data to the server via a POST request
    fetch('/writer/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),  // Send the article data as JSON
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('Data saved successfully:', data);
        })
        .catch((error) => {
            console.error('Error saving data:', error);
        });
}

// Event listener to trigger the send function (example: on button click)
document.getElementById('save-button').addEventListener('click', prepareDataAndSend);

});