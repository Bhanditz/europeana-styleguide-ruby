require.config({
  paths: {
      jquery:                        '../lib/jquery',
      media_player_midi:             '../eu/media/search-midi-player',

      touch_move:                     '../lib/jquery.event.move',
      touch_swipe:                    '../lib/jquery.event.swipe',

      midi_dom_load_xmlhttp:         '../lib/midijs/DOMLoader.XMLHttp',
      midi_dom_load_script:          '../lib/midijs/DOMLoader.script',

      midi_audio_detect:             '../lib/midijs/MIDI.audioDetect',
      midi_load_plugin:              '../lib/midijs/MIDI.loadPlugin',
      midi_plugin:                   '../lib/midijs/MIDI.Plugin',
      midi_player:                   '../lib/midijs/MIDI.Player',

      midi_widget_loader:            '../lib/midijs/Widgets.Loader',
      midi_stream:                   '../lib/midijs/stream',
      midi_file:                     '../lib/midijs/midifile',
      midi_replayer:                 '../lib/midijs/replayer',
      midi_vc_base64:                '../lib/midijs/VersionControl.Base64',
      midi_base64:                   '../lib/midijs/base64binary'
  }
});

require(['jquery'], function($){
  require(['media_player_midi'], function(player){
      if(typeof(play_url) != 'undefined'){
          player.init(play_url);
      }
      else{
          console.log('main midi molecule expects media_item');
      }
  });
});