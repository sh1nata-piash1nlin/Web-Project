window.onload = function() {
    var editor = new FroalaEditor('#froala-editor',{
         heightMin: 300, // Set the minimum height of the editor
         placeholderText: 'Start writing your content...',
         toolbarButtons: [
             'bold', 'italic', 'underline', 'strikeThrough', 'heading',
             'fontFamily', 'fontSize', 'color', 'emoticons',
             'inlineStyle', 'paragraphFormat', 'paragraphStyle',
             'align', 'formatOL', 'formatUL', 'outdent', 'indent',
             'undo', 'redo', 'clear', 'insertTable', 'link',
             'image', 'video', 'audio', 'file', 'insertHR',
             'fullscreen', 'quote', 'specialCharacters', 'html', 'codeView',
             'print', 'spellChecker', 'help'
         ],
         toolbarButtonsMD: [ // For medium-sized devices
             'bold', 'italic', 'underline', 'strikeThrough',
             'formatOL', 'formatUL', 'align', 'undo', 'redo'
         ],
         toolbarButtonsSM: [ // For small devices
             'bold', 'italic', 'undo', 'redo'
         ],
         toolbarButtonsXS: [ // For extra-small devices
             'bold', 'italic'
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
         // Optional: Enable the dropdown for selecting headings
         headingDropdown: true ,// This will make a dropdown of headings available in the toolbar
 
         
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
         // paragraphFormat: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5'],
         paragraphStyle: {
             'font-weight': 'bold',
             'font-style': 'italic'
         },
         align: ['left', 'center', 'right', 'justify'],
         paragraphFormatSelection: false,
         // Allow custom styles (inline)
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
             },
             'froalaEditor.contentChanged': function(e, editor) {
                 console.log('Editor content changed');
             },
             'froalaEditor.focus': function(e, editor) {
                 console.log('Editor is focused');
             },
             'froalaEditor.blur': function(e, editor) {
                 console.log('Editor lost focus');
             },
             'froalaEditor.image.inserted': function(e, editor, $img) {
                 console.log('Image inserted: ', $img);
             }
         },
     });
 };
