define(['jquery', 'purl'], function($) {

  var splitParams = function(s){
    var split    = s.split('=');
    var nameVals = [{'n':split[0]}];

    for(var i=1; i<split.length; i++){
      var valName = split[i];
      if(i==split.length-1){
        nameVals[nameVals.length-1]['v'] = split[split.length-1].replace(/&/g, '%26');
        continue;
      }
      var index   = valName.lastIndexOf('&');
      var value   = valName.substr(0, index);
      var name    = valName.substr(index+1, valName.length);
      nameVals[i-1]['v'] = value.replace(/&/g, '%26');
      nameVals.push({'n':name});
    }

    console.log(JSON.stringify(nameVals, null, 4));
    return nameVals;
  }

  var redirectOrCallback = function(callback){
    var href      = window.location.href;
    var purl      = $.url(href);
    var paramFrom = purl.param('from');

    if(paramFrom == 'europeanafashion.eu'){
      var hash    = href.split('#')[1];
      var urlRoot = href.split('?')[0];

      if(hash){
        hash = decodeURIComponent(hash);

        //var params       = hash.split('&');
        var params       = splitParams(hash);
        var facets       = [];
        var dateFacets   = [];
        var toLookup     = ['f[colour][]', 'f[proxy_dc_format.en][]', 'f[proxy_dc_type.en][]'];
        var lookupNeeded = false;
        var newUrl       = '';
        var appendValues = {
          'f[CREATOR][]' : '+(Designer)'
        };
        var prependValues = {
          'f[proxy_dcterms_medium.en][]' : 'Material:+',
          'f[proxy_dc_format.en][]' : 'Technique:+',
          'f[proxy_dc_type.en][]' : 'Object Type:+'
        };
        var facetNames   = {
          'searchTerm' : 'q',
          'inpSearch' : 'q2',
          'color' : 'f[colour][]',
          'colour' : 'f[colour][]',
          'dcCreator' : 'f[CREATOR][]',
          'dataProviders' : 'f[DATA_PROVIDER][]',
          'objectType' : 'f[proxy_dc_type.en][]',
          'techsAndMaterials' : 'f[proxy_dc_format.en][]',
          'datesNormalized' : 'range[YEAR][begin]'
        };

        var gotoNewUrl = function(){
          $('html').addClass('redirecting');
          var newUrlParams = [];
          $.each(facets, function(i, f){
            newUrlParams.push(f[0] + '=' + (prependValues[f[0]] || '') + f[1] + (appendValues[f[0]] || ''));
          });
          //console.log(urlRoot + '?' + newUrlParams.join('&'));
          window.location.href = urlRoot + '?' + newUrlParams.join('&');
        };

        // normalise names to facets array

        $.each(params, function(i, p){
          //var param = p.split('=');
          var fName = facetNames[p['n']] || p['n'];
          var fVal  = p['v'];

          if(toLookup.indexOf(fName) > -1){
            lookupNeeded = true;
          }
          if(fName == 'range[YEAR][begin]'){
            dateFacets.push([fName, fVal]);
          }
          else{
            ['q', 'q2'].indexOf(fName) > -1 ? facets.unshift([fName, fVal]) : facets.push([fName, fVal]);
          }
        });

        /*
        $.each(params, function(i, p){
          var param = p.split('=');
          var fName = facetNames[param[0]] || param[0];
          var fVal  = param[1];

          if(toLookup.indexOf(fName) > -1){
            lookupNeeded = true;
          }
          if(fName == 'range[YEAR][begin]'){
            dateFacets.push([fName, fVal]);
          }
          else{
            ['q', 'q2'].indexOf(fName) > -1 ? facets.unshift([fName, fVal]) : facets.push([fName, fVal]);
          }
        });
        */

        // deal with duplicate params

        if(facets[0][0] == 'q2'){
          if(facets.length > 1 && facets[1][0] == 'q'){
            // remove q2 from pos 0
            facets.splice(0, 1);
          }
          else{
            // rename q2 to q
            facets[0][0] = 'q'
          }
        }
        else if(facets.length > 1 && facets[1][0] == 'q2'){
          if(facets[0][0] == 'q'){
            // remove q2 from pos 1
            facets.splice(1, 1);
          }
        }

        // convert (or) query to and query
        if(facets[0][0] == 'q'){
          facets[0][1] = facets[0][1].replace(/\+/g, '+OR+').replace(/ /g, ' OR ').replace(/%20/g, '%20OR%20');
        }

        // normalise date values

        if(dateFacets.length > 0){
          var dateValues = [];
          var bce        = false;
          $.each(dateFacets, function(i, df){
            var parts = df[1].split('-');

            $.each(parts, function(i, part){
              if($.isNumeric(part)){
                dateValues.push(parseInt(part));
              }
              else if(part.length > 0){
                if(part[part.length-1] == 's'){
                  var shortened = part.substr(0, part.length-1);
                  if($.isNumeric(shortened)){
                    dateValues.push(parseInt(shortened));
                    dateValues.push(parseInt(shortened) + 9);
                  }
                }
                else if(part == 'BCE'){
                  bce = true;
                }
              }
            });
          });
          var dateMax   = Math.max.apply(null, dateValues);
          var dateMin   = Math.min.apply(null, dateValues);
          if(!bce){
            facets.push(['range[YEAR][begin]', dateMin]);
          }
          if(dateMax != dateMin){
            facets.push(['range[YEAR][end]', bce ? Math.max(0, dateMax) : dateMax]);
          }
          else if(bce){
            facets.push(['range[YEAR][end]', Math.max(0, dateMax)]);
          }
        }

        // handle lookups

        if(lookupNeeded){
          require(['data_fashion_thesaurus'], function(data){
            $.each(facets, function(i, f){
              var abbreviated = (f[1]+'').replace('http://thesaurus.europeanafashion.eu/thesaurus/', '');
              if(toLookup.indexOf(f[0]) > -1){
                if(data['colours'][abbreviated]){
                  f[1] = data['colours'][abbreviated];
                }
                else if(data['type'][abbreviated]){
                  f[1] = data['type'][abbreviated];
                }
                else if(data['materials'][abbreviated]){
                  f[0] = 'f[proxy_dcterms_medium.en][]';
                  f[1] = data['materials'][abbreviated];
                }
                else if(data['techniques'][abbreviated]){
                  f[1] = data['techniques'][abbreviated];
                }
              }
            });
            gotoNewUrl();
          });
        }
        else{
          gotoNewUrl();
        }
      }
      else{
        if(callback){
          callback();
        }
      }
    }
    else{
      if(callback){
        callback();
      }
    }
  };
  return {
    redirectOrCallback : function(callback){
      redirectOrCallback(callback);
    }
  }
});