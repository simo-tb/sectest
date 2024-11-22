window.onload = function() {
  window.ELEMENTS_COUNT = 100;
  window.UNPOSITIONED_ITEMS_PER_ROW = 10;
  window.UPDATE_MS = 2000;
  window.OBJ_EXPIRATION = null;
  window.HAS_GRID = true;
  window.ENABLE_XY = false;
  window.AUTOSCALE = !false;
  window.AUTOSIZE = false;
  window.DISABLE_WHEEL_ZOOM = !true;
  window.IS_EDITABLE = true;
  window.HIDE_INACTIVE_MENU = !true;
  window.ITEM_WIDTH = 200;
  window.ITEM_HEIGHT = 200;
  window.TOGGLE_EDIT = true;
  window.MENU_ITEMS = [ 'edit', 'cancel', 'zoom', 'resizeH', 'resizeW', 'opacity' ];
  window.stats = {
    totalUpdate: [],
    dataGeneration: [],
    dataUpdate: [],
    D3Update: [],
    DOMUpdate: [],
  }


  var config = {
    element: '#container',
    prefixClassName: 'tb-lg-',
    hideInactiveMenu: HIDE_INACTIVE_MENU,
    // menuItems: MENU_ITEMS,
    CSSJSON: {

    },
    backgroundImage: {
      src: 'https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg',
      width: 200,
      height: 300
    },
    types: {
      machine: {
        template: '<div class="jesus">Terminator</div>'
        + '<span class="hello"></span>'
        + '<span class="test"></span>'
        + '<span class="content"></span>'
        + '<div class="imgr" style="display: inline-block;"></div>'
        + '<img src alt="image" />',
        cssjson: {
          '.content': {
            fontSize: '3em',
          },
        },
        contents: {
          hello: {
            selector: '.hello',
          },
          jesus: {
            selector: '.jesus',
          },
          test: {
            selector: '.test',
          },
          content: {
            selector: '.content',
            property: 'innerHTML',
          },
          upperImage: {
            selector: 'img',
            attribute: 'src',
          },
        },
        attributes: {
          attr0: {
            priority: 1,
            states: {
              state1: {
                cssjson: {
                  '': {
                    backgroundColor: 'red',
                  },
                },
              },
              state2: {
                cssjson: {
                  '': {
                    backgroundColor: 'blue',
                  }
                },
              },
              state3: {
                cssjson: {
                  '': {
                    backgroundColor: 'green',
                  }
                },
              },
            },
          },
          attr1: {
            priority: 2,
            states: {
              state1: {
                  cssjson: {
                    '': {
                      color: 'yellow',
                    }
                  },
              },
              state2: {
                cssjson: {
                  '': {
                      color: 'black',

                  }
                },
              },
              state3: {
                cssjson: {
                  '': {
                      color: 'white',
                  }
                },
              },
            }
          },
          attr2: {
            priority: 3,
            states: {
              state1: {
                  cssjson: {
                    '': {
                      opacity: 1,
                    }
                  },
              },
              state2: {
                cssjson: {
                  '': {
                      opacity: 0.9,

                  }
                },
              },
              state3: {
                cssjson: {
                  '': {
                      opacity: 0.8,
                  }
                },
              },
            },
          },
          attr3: {
            priority: 4,
            states: {
              state1: {
                cssjson: {
                  '': {
                    borderColor: 'gold',
                    borderWidth: '10px',
                    borderStyle: 'solid',
                  },
                },
              },
              state2: {
                cssjson: {
                  '': {
                    borderColor: 'silver',
                    borderWidth: '10px',
                    borderStyle: 'solid',
                  },
                },
              },
              state3: {
                cssjson: {
                  '': {
                    borderColor: 'lime',
                    borderWidth: '10px',
                    borderStyle: 'solid',
                  },
                },
              },
            },
          },
          attr4: {
            priority: 5,
            states: {
              state1: {
                cssjson: {
                  '': {
                    borderStyle: 'dashed',
                  },
                },
              },
              state2: {
                cssjson: {
                  '': {
                    borderStyle: 'dotted',
                  },
                },
              },
              state3: {
                cssjson: {
                  '': {
                    borderStyle: 'double',
                  },
                },
              },
            },
          },
          attr5: {
            priority: 6,
            states: {
              state1: {
                cssjson: {
                  '.jesus': {
                    fontWeight: 'normal',
                  },
                },
              },
              state2: {
                cssjson: {
                  '.jesus': {
                    fontWeight: 'bold',
                  },
                },
              },
              state3: {
                cssjson: {
                  '.jesus': {
                    fontWeight: 'bolder',
                  },
                },
              },
            },
          },
          attr6: {
            priority: 7,
            states: {
              state1: {
                cssjson: {
                  '': {
                    fontSize: '10px',
                  },
                },
              },
              state2: {
                cssjson: {
                  '': {
                    fontSize: '15px',
                  },
                },
              },
              state3: {
                cssjson: {
                  '': {
                    fontSize: '20px',
                  },
                },
              },
            },
          },
          attr7: {
            priority: 8,
            states: {
              state1: {
                cssjson: {
                  '.jesus': {
                    textDecoration: 'none',
                  },
                  '.hello': {
                    textDecoration: 'none',
                  },
                },
              },
              state2: {
                cssjson: {
                  '.jesus': {
                    textDecoration: 'underline',
                  },
                  '.hello': {
                    textDecoration: 'underline',
                  },
                },
              },
              state3: {
                cssjson: {
                  '.jesus': {
                    textDecoration: 'line-through',
                  },
                  '.hello': {
                    textDecoration: 'line-through',
                  },
                },
              },
            },
          },
          attr8: {
            priority: 9,
            states: {
              state1: {
                cssjson: {
                  '': {
                    borderLeftWidth: '10px',
                  },
                },
              },
              state2: {
                cssjson: {
                  '': {
                    borderLeftWidth: '20px',
                  },
                },
              },
              state3: {
                cssjson: {
                  '': {
                    borderLeftWidth: '30px',
                  },
                },
              },
            },
          },
          attr9: {
            priority: 10,
            states: {
              state1: {
                cssjson: {
                  '.imgr': {
                    width: '50px',
                    height: '50px',
                    backgroundImage: 'url(https://cdn0.iconfinder.com/data/icons/Destroycons_Pack/256/IE-destroy.png)',
                    backgroundSize: 'contain',
                  },
                },
              },
              state2: {
                cssjson: {
                  '.imgr': {
                    width: '50px',
                    height: '50px',
                    backgroundImage: 'url(https://cdn4.iconfinder.com/data/icons/artcore/512/firefox.png)',
                    backgroundSize: 'contain',
                  },
                },
              },
              state3: {
                cssjson: {
                  '.imgr': {
                    width: '50px',
                    height: '50px',
                    backgroundImage: 'url(https://cdn2.iconfinder.com/data/icons/social-media-8/512/Chrome.png)',
                    backgroundSize: 'contain',
                  },
                },
              },
            },
          },
        },
      },
      // people: {
      //   template: '<div>Pupil</div>',

      // },
    },
  };
  if(HAS_GRID) {
    config.grid = {
      isEnabled: true,
      itemWidth: ITEM_WIDTH,
      itemHeight: ITEM_HEIGHT,
      unpositionedItemsPerRow: UNPOSITIONED_ITEMS_PER_ROW,
      isEditable: IS_EDITABLE,
      autoscale: AUTOSCALE,
      autosize: AUTOSIZE,
      disableWheelZoom: DISABLE_WHEEL_ZOOM,
    };
  }

  var plugin1 = TB.Livegrid(config, generateElements());
  window.plugin1 = plugin1;

  if(TOGGLE_EDIT) {
    plugin1.toggleEditMode();
  }

  // setTimeout(function() {
  setInterval(function() {
    stats.totalUpdate[0] = new Date();
    stats.dataGeneration[0] = new Date();
    var data = generateElements();
    stats.dataGeneration[1] = new Date();
    plugin1.updateItems(data);
    stats.totalUpdate[1] = new Date();

    updateStatsTable();
  }, UPDATE_MS);


  /** Helper functions
   * */

  function updateStatsTable() {
    for(var id in stats) {
      document.getElementById(id).textContent = stats[id][1] - stats[id][0];
    }
  }

  function generateElements() {
    var data = [];

    var xArr = shuffle(range(ELEMENTS_COUNT, ITEM_WIDTH));
    var yArr = shuffle(range(ELEMENTS_COUNT, ITEM_HEIGHT));

    for(var i = 1; i <= ELEMENTS_COUNT; i++) {
      var obj = {};

      obj.id = i;
      obj.attributes = {};
      obj.contents = {};
      obj.type = 'machine';

      if(ENABLE_XY) {
        obj.x = xArr.shift();
        obj.y = yArr.shift();
      }

      obj.expiresIn = OBJ_EXPIRATION;

      if(randomTrue()) {
        obj.attributes.attr0 = randomArrElement(['state1', 'state2', 'state3']);
      }

      if(randomTrue()) {
        obj.attributes.attr1 = randomArrElement(['state1', 'state2', 'state3']);
      }

      if(randomTrue()) {
        obj.attributes.attr2 = randomArrElement(['state1', 'state2', 'state3']);
      }

      if(randomTrue()) {
        obj.attributes.attr3 = randomArrElement(['state1', 'state2', 'state3']);
      }

      if(randomTrue()) {
        obj.attributes.attr4 = randomArrElement(['state1', 'state2', 'state3']);
      }

      if(randomTrue()) {
        obj.attributes.attr5 = randomArrElement(['state1', 'state2', 'state3']);
      }

      if(randomTrue()) {
        obj.attributes.attr6 = randomArrElement(['state1', 'state2', 'state3']);
      }

      if(randomTrue()) {
        obj.attributes.attr7 = randomArrElement(['state1', 'state2', 'state3']);
      }

      if(randomTrue()) {
        obj.attributes.attr8 = randomArrElement(['state1', 'state2', 'state3']);
      }

      if(randomTrue()) {
        obj.attributes.attr9 = randomArrElement(['state1', 'state2', 'state3']);
      }

      if(randomTrue()) {
        obj.contents.hello = parseInt(Math.random() * 100);
      }

      if(randomTrue()) {
        obj.contents.jesus = parseInt(Math.random() * 100);
      }

      if(randomTrue()) {
        obj.contents.test = parseInt(Math.random() * 100);
      }

      if(randomTrue()) {
        obj.contents.content = '<span>' + parseInt(Math.random() * 100) + '</span>';
      }

      if(randomTrue()) {
        obj.contents.upperImage = randomArrElement([
          'https://38.media.tumblr.com/avatar_b7685ec3b252_128.png'
          , 'https://mootennis.files.wordpress.com/2014/08/2014_08_13-ws-tennis-wednesday-ana-ivanovic.jpg?w=50&h=50&crop=1'
          ]);
      }

      data.push(obj);
    }

    return {
      items: data,
    };
  }

  function randomTrue() {
    return Math.random() > 0.5;
  }

  function randomArrElement(items) {
    return items[Math.floor(Math.random()*items.length)];
  }

  function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  function range(size, factor) {
    var arr = [];

    for (var i = 0; i < size; i++) {
       arr.push(i * (factor || 1));
    }

    return arr;
  }
};
