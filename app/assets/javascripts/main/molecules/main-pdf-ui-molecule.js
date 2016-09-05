require.config({
    paths: {
        jquery:                        '../../lib/jquery/jquery',
        pdfjs:                         '../../lib/pdfjs/pdf',
        pdf_ui:                        '../../lib/pdfjs/pdf-ui',
        pdf_lang:                      '../../lib/pdfjs/l10n',
        media_viewer_pdf:              '../../eu/media/search-pdf-ui-viewer'
    },
    shim: {
        pdf_viewer: ['jquery']
    }
});

require(['jquery'], function(){
    require(['pdfjs'], function(){
        require(['pdf_lang'], function(){
            require(['media_viewer_pdf'], function(viewer){
                viewer.init('/media/falcon.pdf');
            });
        });
    });
});
