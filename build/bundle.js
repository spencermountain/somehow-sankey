var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.22.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    // add forward/backwards links
    const addLinks = function (byCol) {
      byCol.forEach((nodes, i) => {
        nodes.forEach((node) => {
          if (node.to && byCol[i + 1]) {
            let foundTo = byCol[i + 1].find((n) => n.name === node.to);
            if (foundTo) {
              node.tos.push(foundTo);
              foundTo.froms.push(node);
            }
          }
          // allow backward-set links, too
          if (node.from && byCol[i - 1]) {
            let found = byCol[i - 1].find((n) => n.name === node.from);
            // found.tos.push(node)
            // node.froms.push(found)
          }
        });
      });
    };

    const addStack = function (byCol) {
      byCol.forEach((nodes) => {
        let lastOne = null;
        nodes.forEach((node) => {
          if (node.to === lastOne) {
            node.stacked = true;
          }
          lastOne = node.to;
        });
      });
    };

    const byColumn = function (items) {
      let byCol = [];
      items.forEach((node) => {
        if (node.value) {
          node.value = Number(node.value);
        }
        byCol[node.col] = byCol[node.col] || [];
        node.top = 0;
        node.inputs = 0;
        node.froms = [];
        node.stacked = false;

        node.tos = [];
        byCol[node.col].push(node);
      });
      byCol.shift();
      return byCol
    };

    // turn into array of arrays (by Column)
    const fmt = function (items) {
      let byCol = byColumn(items);
      addLinks(byCol);
      addStack(byCol);
      return byCol
    };

    //get value from sum of inputs
    const getValues = function (byCol) {
      byCol.forEach((nodes) => {
        nodes.forEach((node) => {
          node.sum = 0;
          node.froms.forEach((n) => (node.sum += n.value));
          if (node.sum > node.value) {
            node.value = node.sum;
          }
        });
      });
      return byCol
    };

    const bySum = function (byCol) {
      byCol.forEach((nodes) => {
        let already = 0;
        nodes.forEach((node) => {
          node.top = already;
          already += node.value;
        });
      });
      return byCol
    };

    // align each node with right-node
    const byNeighbour = function (byCol) {
      byCol.forEach((nodes) => {
        nodes.forEach((node, n) => {
          if (node.tos.length === 1 && node.tos[0].top > node.top) {
            console.log('moving ' + node.name);
            node.top = node.tos[0].top;
            // move down stacked-nodes as well
            let already = node.top + node.value;
            for (let i = n + 1; i < nodes.length; i += 1) {
              // console.log('... and moving ' + nodes[i].name)
              if (nodes[i].stacked === true) {
                nodes[i].top = already;
                already += nodes[i].value;
              } else {
                break
              }
            }
          }
        });
      });
      return byCol
    };

    const getMax = function (byCol) {
      let max = 0;
      byCol.forEach((nodes) => {
        nodes.forEach((node) => {
          let total = node.top + node.value;
          if (total > max) {
            max = total;
          }
        });
      });
      return max
    };

    // splay-out stacked nodes a bit
    const addMargin = function (byCol) {
      let max = getMax(byCol);
      let margin = max * 0.015;
      byCol.forEach((nodes) => {
        let count = 1;
        nodes.forEach((node) => {
          if (node.stacked) {
            node.top += margin * count;
            count += 1;
          } else {
            count = 1;
          }
        });
      });
      return byCol
    };

    const findStart = function (byCol) {
      byCol = bySum(byCol);
      // wiggle-this out by right-neighbour
      byCol = byNeighbour(byCol);
      byCol = addMargin(byCol);
      byCol = byNeighbour(byCol);
      return byCol
    };
    var _03GetTops = findStart;

    //a very-tiny version of d3-scale's scaleLinear
    const scaleLinear = function (obj) {
      let world = obj.world || [];
      let minmax = obj.minmax || obj.minMax || [];
      const calc = (num) => {
        let range = minmax[1] - minmax[0];
        let percent = (num - minmax[0]) / range;
        let size = world[1] - world[0];
        return parseInt(size * percent, 10)
      };

      return calc
    };

    // let scale = scaleLinear({
    //   world: [0, 300],
    //   minmax: [0, 100]
    // })
    // console.log(scale(50))

    var scale = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': scaleLinear
    });

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    function getCjsExportFromNamespace (n) {
    	return n && n['default'] || n;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var linear = getCjsExportFromNamespace(scale);

    const topRoom = 20;

    const getMax$1 = function (byCol) {
      let max = 0;
      byCol.forEach((nodes) => {
        nodes.forEach((node) => {
          let total = node.top + node.value;
          if (total > max) {
            max = total;
          }
        });
      });
      return max
    };

    const applyDx = function (node) {
      if (node.dx) {
        node.x += node.dx;
      }
      if (node.dy) {
        node.y += node.dy;
      }
      return node
    };

    const shrinkLongNodes = function (byCol) {
      byCol.forEach((nodes) => {
        if (nodes.length === 1) {
          nodes[0].y += topRoom;
        }
      });
    };

    const makePoints = function (byCol, width, height, nodeWidth) {
      let max = getMax$1(byCol);
      let yScale = linear({ minmax: [0, max], world: [0, height] });
      let xScale = linear({ minmax: [0, byCol.length], world: [0, width] });
      byCol.forEach((nodes) => {
        nodes.forEach((node) => {
          node.y = yScale(node.top);
          node.height = yScale(node.value);
          node.x = xScale(node.col);
          node.width = nodeWidth;
          node = applyDx(node);
        });
      });
      // give cols with many margins more space
      shrinkLongNodes(byCol);
      return byCol
    };
    var _04MakePoints = makePoints;

    const pinchDown = function (from, to) {
      return ` L${to[0]},${to[1]}`
      // return ` S${from[0] + 50},${from[1] + 15}   ${to[0]},${to[1]}`
    };
    const pinchUp = function (from, to) {
      return ` L${to[0]},${to[1]}`
      // return ` S${from[0] + 50},${from[1] - 15}   ${to[0]},${to[1]}`
    };

    const makePath = function (from, to) {
      let already = from.alreadyFrom;
      let path = `M${from.x + from.width},${from.y + already}`; // (source-top)
      // dest-top
      path += ` L${to.x},${to.y}`;
      // dest-bottom
      path += ` L${to.x},${to.y + to.height}`;
      // source-bottom
      path += ` L${from.x + from.width},${from.y + to.height + already}`;
      path += ` Z`;
      return path
    };

    const backwardPaths = function (nodes) {
      let paths = [];
      nodes.forEach((to) => {
        if (to.from) {
          let source = nodes.find((n) => n.name === to.from);
          source.alreadyFrom = source.alreadyFrom || 0;
          let path = makePath(source, to);
          source.alreadyFrom += to.height;
          paths.push(path);
        }
      });
      return paths
    };

    const makePaths = function (nodes) {
      let paths = [];
      nodes.forEach((node) => {
        let fromX = node.x + node.width;
        let fromY = node.y;
        let h = node.height;
        node.tos.forEach((to) => {
          to.already = to.already || 0;
          // node top-right
          let d = `M${fromX},${fromY}`;
          // dest top-left
          d += pinchDown([fromX, fromY], [to.x, to.y + to.already]);
          // dest bottom-left
          d += ` L${to.x},${to.y + h + to.already}`;
          // back to bottom of node
          d += pinchUp([to.x, to.y + h + to.already], [fromX, fromY + h]);
          // fill it
          d += ` Z`;
          to.already += node.height;

          paths.push(d);
        });
      });
      let backward = backwardPaths(nodes);
      paths = paths.concat(backward);
      return paths
    };
    var _05MakePaths = makePaths;

    let toFlat = function (byCol) {
      let list = [];
      byCol.forEach((nodes) => {
        nodes.forEach((node) => {
          list.push(node);
        });
      });
      // remove empty nodes
      list = list.filter((n) => n.value);
      return list
    };

    const layout = function (items, width, height, nodeWidth) {
      let byCol = fmt(items);
      // add value
      byCol = getValues(byCol);
      // add top
      byCol = _03GetTops(byCol);
      // add x, y, width, height
      byCol = _04MakePoints(byCol, width, height, nodeWidth);

      let nodes = toFlat(byCol);
      let paths = _05MakePaths(nodes);

      return {
        nodes: nodes,
        paths: paths,
        nodeWidth: nodeWidth,
      }
    };

    /* src/Dots.svelte generated by Svelte v3.22.2 */

    const { console: console_1 } = globals;
    const file = "src/Dots.svelte";

    function create_fragment(ctx) {
    	let svg;
    	let defs;
    	let pattern;
    	let circle;
    	let rect;
    	let rect_fill_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			pattern = svg_element("pattern");
    			circle = svg_element("circle");
    			rect = svg_element("rect");
    			attr_dev(circle, "fill", /*color*/ ctx[0]);
    			attr_dev(circle, "cx", "4");
    			attr_dev(circle, "cy", "4");
    			attr_dev(circle, "r", "2");
    			add_location(circle, file, 45, 6, 900);
    			attr_dev(pattern, "id", /*id*/ ctx[1]);
    			attr_dev(pattern, "x", "0");
    			attr_dev(pattern, "y", "0");
    			attr_dev(pattern, "width", "6");
    			attr_dev(pattern, "height", "6");
    			attr_dev(pattern, "patternUnits", "userSpaceOnUse");
    			add_location(pattern, file, 38, 4, 780);
    			add_location(defs, file, 37, 2, 769);
    			attr_dev(rect, "x", "0");
    			attr_dev(rect, "y", "0");
    			attr_dev(rect, "width", "100%");
    			attr_dev(rect, "height", "100%");
    			attr_dev(rect, "fill", rect_fill_value = "url(#" + /*id*/ ctx[1] + ")");
    			add_location(rect, file, 49, 2, 972);
    			attr_dev(svg, "width", "100%");
    			attr_dev(svg, "height", "100%");
    			add_location(svg, file, 36, 0, 734);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, defs);
    			append_dev(defs, pattern);
    			append_dev(pattern, circle);
    			append_dev(svg, rect);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*color*/ 1) {
    				attr_dev(circle, "fill", /*color*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function uuid() {
    	return ("xxxxxx").replace(/[xy]/g, function (c) {
    		var r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
    		return v.toString(16);
    	});
    }

    function instance($$self, $$props, $$invalidate) {
    	let { color = "steelblue" } = $$props;
    	let id = uuid();
    	console.log(color);
    	const writable_props = ["color"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Dots> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Dots", $$slots, []);

    	$$self.$set = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({ color, uuid, id });

    	$$self.$inject_state = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, id];
    }

    class Dots extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { color: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dots",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get color() {
    		throw new Error("<Dots>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Dots>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const items = writable([]);
    let colCount = writable(0);

    var spencerColor = createCommonjsModule(function (module, exports) {
    !function(e){module.exports=e();}(function(){return function u(i,a,c){function f(r,e){if(!a[r]){if(!i[r]){var o="function"==typeof commonjsRequire&&commonjsRequire;if(!e&&o)return o(r,!0);if(d)return d(r,!0);var n=new Error("Cannot find module '"+r+"'");throw n.code="MODULE_NOT_FOUND",n}var t=a[r]={exports:{}};i[r][0].call(t.exports,function(e){return f(i[r][1][e]||e)},t,t.exports,u,i,a,c);}return a[r].exports}for(var d="function"==typeof commonjsRequire&&commonjsRequire,e=0;e<c.length;e++)f(c[e]);return f}({1:[function(e,r,o){r.exports={blue:"#6699cc",green:"#6accb2",yellow:"#e1e6b3",red:"#cc7066",pink:"#F2C0BB",brown:"#705E5C",orange:"#cc8a66",purple:"#d8b3e6",navy:"#335799",olive:"#7f9c6c",fuscia:"#735873",beige:"#e6d7b3",slate:"#8C8C88",suede:"#9c896c",burnt:"#603a39",sea:"#50617A",sky:"#2D85A8",night:"#303b50",rouge:"#914045",grey:"#838B91",mud:"#C4ABAB",royal:"#275291",cherry:"#cc6966",tulip:"#e6b3bc",rose:"#D68881",fire:"#AB5850",greyblue:"#72697D",greygreen:"#8BA3A2",greypurple:"#978BA3",burn:"#6D5685",slategrey:"#bfb0b3",light:"#a3a5a5",lighter:"#d7d5d2",fudge:"#4d4d4d",lightgrey:"#949a9e",white:"#fbfbfb",dimgrey:"#606c74",softblack:"#463D4F",dark:"#443d3d",black:"#333333"};},{}],2:[function(e,r,o){var n=e("./colors"),t={juno:["blue","mud","navy","slate","pink","burn"],barrow:["rouge","red","orange","burnt","brown","greygreen"],roma:["#8a849a","#b5b0bf","rose","lighter","greygreen","mud"],palmer:["red","navy","olive","pink","suede","sky"],mark:["#848f9a","#9aa4ac","slate","#b0b8bf","mud","grey"],salmon:["sky","sea","fuscia","slate","mud","fudge"],dupont:["green","brown","orange","red","olive","blue"],bloor:["night","navy","beige","rouge","mud","grey"],yukon:["mud","slate","brown","sky","beige","red"],david:["blue","green","yellow","red","pink","light"],neste:["mud","cherry","royal","rouge","greygreen","greypurple"],ken:["red","sky","#c67a53","greygreen","#dfb59f","mud"]};Object.keys(t).forEach(function(e){t[e]=t[e].map(function(e){return n[e]||e});}),r.exports=t;},{"./colors":1}],3:[function(e,r,o){var n=e("./colors"),t=e("./combos"),u={colors:n,list:Object.keys(n).map(function(e){return n[e]}),combos:t};r.exports=u;},{"./colors":1,"./combos":2}]},{},[3])(3)});
    });

    /* src/Sankey.svelte generated by Svelte v3.22.2 */
    const file$1 = "src/Sankey.svelte";

    function add_css() {
    	var style = element("style");
    	style.id = "svelte-za3vrg-style";
    	style.textContent = ".node.svelte-za3vrg{position:absolute;border-radius:3px;box-shadow:2px 2px 8px 0px rgba(0, 0, 0, 0.2);color:#dedede;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;border-bottom:4px solid #d98b89;font-size:15px;font-family:'Catamaran', sans-serif}.link.svelte-za3vrg{opacity:0.2;z-index:1}.link.svelte-za3vrg:hover{stroke-opacity:1}.value.svelte-za3vrg{font-size:25px;z-index:2}.label.svelte-za3vrg{z-index:2}.tiny.svelte-za3vrg{z-index:2;flex-direction:row;font-size:12px !important;justify-content:space-evenly}.drop.svelte-za3vrg{position:absolute;top:0px;z-index:1}.dots.svelte-za3vrg{position:absolute;top:0px;height:100%;width:100%;z-index:0}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2Fua2V5LnN2ZWx0ZSIsInNvdXJjZXMiOlsiU2Fua2V5LnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgbGF5b3V0IGZyb20gJy4vbGF5b3V0J1xuICBpbXBvcnQgRG90cyBmcm9tICcuL0RvdHMuc3ZlbHRlJ1xuICBpbXBvcnQgeyBpdGVtcyB9IGZyb20gJy4vbGliL3N0b3JlLmpzJ1xuICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJ1xuICBpbXBvcnQgYyBmcm9tICdzcGVuY2VyLWNvbG9yJ1xuICBsZXQgY29sb3JzID0gYy5jb2xvcnNcbiAgZXhwb3J0IGxldCB3aWR0aCA9IDgwMFxuICBleHBvcnQgbGV0IGhlaWdodCA9IDUwMFxuICBleHBvcnQgbGV0IG5vZGVXaWR0aCA9IDEyMFxuICBleHBvcnQgbGV0IGZtdCA9IG51bSA9PiB7XG4gICAgaWYgKG51bSA+PSAxMDAwMDAwKSB7XG4gICAgICBudW0gPSBNYXRoLnJvdW5kKG51bSAvIDEwMDAwMDApICogMTAwMDAwMFxuICAgICAgcmV0dXJuIFN0cmluZyhudW0gLyAxMDAwMDAwKSArICdtJ1xuICAgIH1cbiAgICBpZiAobnVtID4gMTAwMCkge1xuICAgICAgcmV0dXJuIFN0cmluZyhudW0gLyAxMDAwKSArICdrJ1xuICAgIH1cbiAgICByZXR1cm4gU3RyaW5nKG51bSlcbiAgfVxuICBoZWlnaHQgPSBOdW1iZXIoaGVpZ2h0KVxuICB3aWR0aCA9IE51bWJlcih3aWR0aClcbiAgbGV0IG5vZGVzID0gW11cbiAgbGV0IHBhdGhzID0gW11cbiAgbGV0IGNvbG9yID0gJ3N0ZWVsYmx1ZSdcbiAgbGV0IGFjY2VudCA9ICcjZDk4Yjg5J1xuICBvbk1vdW50KCgpID0+IHtcbiAgICA7KHsgbm9kZXMsIHBhdGhzIH0gPSBsYXlvdXQoJGl0ZW1zLCB3aWR0aCwgaGVpZ2h0LCBub2RlV2lkdGgpKVxuICAgIC8vIGNvbnNvbGUubG9nKHBhdGhzKVxuICB9KVxuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbiAgLm5vZGUge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICBib3JkZXItcmFkaXVzOiAzcHg7XG4gICAgYm94LXNoYWRvdzogMnB4IDJweCA4cHggMHB4IHJnYmEoMCwgMCwgMCwgMC4yKTtcbiAgICBjb2xvcjogI2RlZGVkZTtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgYm9yZGVyLWJvdHRvbTogNHB4IHNvbGlkICNkOThiODk7XG4gICAgZm9udC1zaXplOiAxNXB4O1xuICAgIGZvbnQtZmFtaWx5OiAnQ2F0YW1hcmFuJywgc2Fucy1zZXJpZjtcbiAgfVxuICAubGluayB7XG4gICAgb3BhY2l0eTogMC4yO1xuICAgIHotaW5kZXg6IDE7XG4gIH1cbiAgLmxpbms6aG92ZXIge1xuICAgIHN0cm9rZS1vcGFjaXR5OiAxO1xuICB9XG4gIC52YWx1ZSB7XG4gICAgZm9udC1zaXplOiAyNXB4O1xuICAgIHotaW5kZXg6IDI7XG4gIH1cbiAgLmxhYmVsIHtcbiAgICB6LWluZGV4OiAyO1xuICB9XG4gIC50aW55IHtcbiAgICB6LWluZGV4OiAyO1xuICAgIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gICAgZm9udC1zaXplOiAxMnB4ICFpbXBvcnRhbnQ7XG4gICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1ldmVubHk7XG4gIH1cbiAgLmRyb3Age1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICB0b3A6IDBweDtcbiAgICB6LWluZGV4OiAxO1xuICB9XG4gIC5kb3RzIHtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgdG9wOiAwcHg7XG4gICAgaGVpZ2h0OiAxMDAlO1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIHotaW5kZXg6IDA7XG4gIH1cbjwvc3R5bGU+XG5cbjxkaXYgc3R5bGU9XCJwb3NpdGlvbjpyZWxhdGl2ZTtcIj5cbiAgPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlOyB3aWR0aDp7d2lkdGh9cHg7IGhlaWdodDp7aGVpZ2h0fXB4O1wiPlxuICAgIHsjZWFjaCBub2RlcyBhcyBkfVxuICAgICAgPGRpdlxuICAgICAgICBjbGFzcz1cIm5vZGVcIlxuICAgICAgICBjbGFzczp0aW55PXtkLmhlaWdodCA8IDgwfVxuICAgICAgICBzdHlsZT1cImxlZnQ6e2QueH1weDsgdG9wOntkLnl9cHg7IHdpZHRoOntkLndpZHRofXB4OyBoZWlnaHQ6e2QuaGVpZ2h0fXB4O1xuICAgICAgICBib3JkZXItYm90dG9tOiA0cHggc29saWQge2NvbG9yc1tkLmFjY2VudF0gfHwgZC5hY2NlbnQgfHwgYWNjZW50fTtcbiAgICAgICAgb3BhY2l0eTp7ZC5vcGFjaXR5IHx8IDF9O1wiPlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY2xhc3M9XCJkcm9wXCJcbiAgICAgICAgICBzdHlsZT1cIndpZHRoOjEwMCU7IGhlaWdodDp7ZC5mdWxsfSU7IGJhY2tncm91bmQtY29sb3I6e2NvbG9yc1tkLmNvbG9yXSB8fCBkLmNvbG9yIHx8IGNvbG9yfTtcIiAvPlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY2xhc3M9XCJkb3RzXCJcbiAgICAgICAgICBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6IHtjb2xvcnNbZC5jb2xvcl0gfHwgZC5jb2xvciB8fCBjb2xvcn07XCI+XG4gICAgICAgICAgPERvdHMgY29sb3I9eyd3aGl0ZSd9IC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibGFiZWxcIj57ZC5uYW1lfTwvZGl2PlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY2xhc3M9XCJ2YWx1ZVwiXG4gICAgICAgICAgY2xhc3M6dGlueT17ZC5oZWlnaHQgPCA4MH1cbiAgICAgICAgICBzdHlsZT1cImNvbG9yOntjb2xvcnNbZC5hY2NlbnRdIHx8IGFjY2VudH07XCI+XG4gICAgICAgICAge2ZtdChkLnZhbHVlKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICB7L2VhY2h9XG5cbiAgPC9kaXY+XG5cbiAgPHN2ZyB2aWV3Qm94PVwiMCwwLHt3aWR0aH0se2hlaWdodH1cIiB7d2lkdGh9IHtoZWlnaHR9PlxuICAgIHsjZWFjaCBwYXRocyBhcyBkfVxuICAgICAgPHBhdGhcbiAgICAgICAgY2xhc3M9XCJsaW5rXCJcbiAgICAgICAge2R9XG4gICAgICAgIHN0cm9rZT1cIm5vbmVcIlxuICAgICAgICBmaWxsPVwibGlnaHRzdGVlbGJsdWVcIlxuICAgICAgICBzdHlsZT1cIlwiXG4gICAgICAgIHN0cm9rZS13aWR0aD17MX0gLz5cbiAgICB7L2VhY2h9XG4gIDwvc3ZnPlxuPC9kaXY+XG5cbjxzbG90IC8+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBaUNFLEtBQUssY0FBQyxDQUFDLEFBQ0wsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsYUFBYSxDQUFFLEdBQUcsQ0FDbEIsVUFBVSxDQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUM5QyxLQUFLLENBQUUsT0FBTyxDQUNkLFVBQVUsQ0FBRSxNQUFNLENBQ2xCLE9BQU8sQ0FBRSxJQUFJLENBQ2IsY0FBYyxDQUFFLE1BQU0sQ0FDdEIsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsZUFBZSxDQUFFLE1BQU0sQ0FDdkIsYUFBYSxDQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUNoQyxTQUFTLENBQUUsSUFBSSxDQUNmLFdBQVcsQ0FBRSxXQUFXLENBQUMsQ0FBQyxVQUFVLEFBQ3RDLENBQUMsQUFDRCxLQUFLLGNBQUMsQ0FBQyxBQUNMLE9BQU8sQ0FBRSxHQUFHLENBQ1osT0FBTyxDQUFFLENBQUMsQUFDWixDQUFDLEFBQ0QsbUJBQUssTUFBTSxBQUFDLENBQUMsQUFDWCxjQUFjLENBQUUsQ0FBQyxBQUNuQixDQUFDLEFBQ0QsTUFBTSxjQUFDLENBQUMsQUFDTixTQUFTLENBQUUsSUFBSSxDQUNmLE9BQU8sQ0FBRSxDQUFDLEFBQ1osQ0FBQyxBQUNELE1BQU0sY0FBQyxDQUFDLEFBQ04sT0FBTyxDQUFFLENBQUMsQUFDWixDQUFDLEFBQ0QsS0FBSyxjQUFDLENBQUMsQUFDTCxPQUFPLENBQUUsQ0FBQyxDQUNWLGNBQWMsQ0FBRSxHQUFHLENBQ25CLFNBQVMsQ0FBRSxJQUFJLENBQUMsVUFBVSxDQUMxQixlQUFlLENBQUUsWUFBWSxBQUMvQixDQUFDLEFBQ0QsS0FBSyxjQUFDLENBQUMsQUFDTCxRQUFRLENBQUUsUUFBUSxDQUNsQixHQUFHLENBQUUsR0FBRyxDQUNSLE9BQU8sQ0FBRSxDQUFDLEFBQ1osQ0FBQyxBQUNELEtBQUssY0FBQyxDQUFDLEFBQ0wsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsR0FBRyxDQUFFLEdBQUcsQ0FDUixNQUFNLENBQUUsSUFBSSxDQUNaLEtBQUssQ0FBRSxJQUFJLENBQ1gsT0FBTyxDQUFFLENBQUMsQUFDWixDQUFDIn0= */";
    	append_dev(document.head, style);
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (84:4) {#each nodes as d}
    function create_each_block_1(ctx) {
    	let div4;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2_value = /*d*/ ctx[12].name + "";
    	let t2;
    	let t3;
    	let div3;
    	let t4_value = /*fmt*/ ctx[2](/*d*/ ctx[12].value) + "";
    	let t4;
    	let t5;
    	let current;

    	const dots = new Dots({
    			props: { color: "white" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			create_component(dots.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			div3 = element("div");
    			t4 = text(t4_value);
    			t5 = space();
    			attr_dev(div0, "class", "drop svelte-za3vrg");
    			set_style(div0, "width", "100%");
    			set_style(div0, "height", /*d*/ ctx[12].full + "%");
    			set_style(div0, "background-color", /*colors*/ ctx[5][/*d*/ ctx[12].color] || /*d*/ ctx[12].color || /*color*/ ctx[6]);
    			add_location(div0, file$1, 90, 8, 2032);
    			attr_dev(div1, "class", "dots svelte-za3vrg");
    			set_style(div1, "background-color", /*colors*/ ctx[5][/*d*/ ctx[12].color] || /*d*/ ctx[12].color || /*color*/ ctx[6]);
    			add_location(div1, file$1, 93, 8, 2175);
    			attr_dev(div2, "class", "label svelte-za3vrg");
    			add_location(div2, file$1, 98, 8, 2337);
    			attr_dev(div3, "class", "value svelte-za3vrg");
    			set_style(div3, "color", /*colors*/ ctx[5][/*d*/ ctx[12].accent] || /*accent*/ ctx[7]);
    			toggle_class(div3, "tiny", /*d*/ ctx[12].height < 80);
    			add_location(div3, file$1, 99, 8, 2379);
    			attr_dev(div4, "class", "node svelte-za3vrg");
    			set_style(div4, "left", /*d*/ ctx[12].x + "px");
    			set_style(div4, "top", /*d*/ ctx[12].y + "px");
    			set_style(div4, "width", /*d*/ ctx[12].width + "px");
    			set_style(div4, "height", /*d*/ ctx[12].height + "px");
    			set_style(div4, "border-bottom", "4px solid " + (/*colors*/ ctx[5][/*d*/ ctx[12].accent] || /*d*/ ctx[12].accent || /*accent*/ ctx[7]));
    			set_style(div4, "opacity", /*d*/ ctx[12].opacity || 1);
    			toggle_class(div4, "tiny", /*d*/ ctx[12].height < 80);
    			add_location(div4, file$1, 84, 6, 1770);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div4, t0);
    			append_dev(div4, div1);
    			mount_component(dots, div1, null);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			append_dev(div2, t2);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, t4);
    			append_dev(div4, t5);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*nodes*/ 8) {
    				set_style(div0, "height", /*d*/ ctx[12].full + "%");
    			}

    			if (!current || dirty & /*nodes*/ 8) {
    				set_style(div0, "background-color", /*colors*/ ctx[5][/*d*/ ctx[12].color] || /*d*/ ctx[12].color || /*color*/ ctx[6]);
    			}

    			if (!current || dirty & /*nodes*/ 8) {
    				set_style(div1, "background-color", /*colors*/ ctx[5][/*d*/ ctx[12].color] || /*d*/ ctx[12].color || /*color*/ ctx[6]);
    			}

    			if ((!current || dirty & /*nodes*/ 8) && t2_value !== (t2_value = /*d*/ ctx[12].name + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty & /*fmt, nodes*/ 12) && t4_value !== (t4_value = /*fmt*/ ctx[2](/*d*/ ctx[12].value) + "")) set_data_dev(t4, t4_value);

    			if (!current || dirty & /*nodes*/ 8) {
    				set_style(div3, "color", /*colors*/ ctx[5][/*d*/ ctx[12].accent] || /*accent*/ ctx[7]);
    			}

    			if (dirty & /*nodes*/ 8) {
    				toggle_class(div3, "tiny", /*d*/ ctx[12].height < 80);
    			}

    			if (!current || dirty & /*nodes*/ 8) {
    				set_style(div4, "left", /*d*/ ctx[12].x + "px");
    			}

    			if (!current || dirty & /*nodes*/ 8) {
    				set_style(div4, "top", /*d*/ ctx[12].y + "px");
    			}

    			if (!current || dirty & /*nodes*/ 8) {
    				set_style(div4, "width", /*d*/ ctx[12].width + "px");
    			}

    			if (!current || dirty & /*nodes*/ 8) {
    				set_style(div4, "height", /*d*/ ctx[12].height + "px");
    			}

    			if (!current || dirty & /*nodes*/ 8) {
    				set_style(div4, "border-bottom", "4px solid " + (/*colors*/ ctx[5][/*d*/ ctx[12].accent] || /*d*/ ctx[12].accent || /*accent*/ ctx[7]));
    			}

    			if (!current || dirty & /*nodes*/ 8) {
    				set_style(div4, "opacity", /*d*/ ctx[12].opacity || 1);
    			}

    			if (dirty & /*nodes*/ 8) {
    				toggle_class(div4, "tiny", /*d*/ ctx[12].height < 80);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dots.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dots.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(dots);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(84:4) {#each nodes as d}",
    		ctx
    	});

    	return block;
    }

    // (112:4) {#each paths as d}
    function create_each_block(ctx) {
    	let path;
    	let path_d_value;
    	let path_stroke_width_value;

    	const block = {
    		c: function create() {
    			path = svg_element("path");
    			attr_dev(path, "class", "link svelte-za3vrg");
    			attr_dev(path, "d", path_d_value = /*d*/ ctx[12]);
    			attr_dev(path, "stroke", "none");
    			attr_dev(path, "fill", "lightsteelblue");
    			attr_dev(path, "stroke-width", path_stroke_width_value = 1);
    			add_location(path, file$1, 112, 6, 2661);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*paths*/ 16 && path_d_value !== (path_d_value = /*d*/ ctx[12])) {
    				attr_dev(path, "d", path_d_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(112:4) {#each paths as d}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let svg;
    	let svg_viewBox_value;
    	let t1;
    	let current;
    	let each_value_1 = /*nodes*/ ctx[3];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let each_value = /*paths*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const default_slot_template = /*$$slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			svg = svg_element("svg");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			if (default_slot) default_slot.c();
    			set_style(div0, "position", "absolute");
    			set_style(div0, "width", /*width*/ ctx[0] + "px");
    			set_style(div0, "height", /*height*/ ctx[1] + "px");
    			add_location(div0, file$1, 82, 2, 1672);
    			attr_dev(svg, "viewBox", svg_viewBox_value = "0,0," + /*width*/ ctx[0] + "," + /*height*/ ctx[1]);
    			attr_dev(svg, "width", /*width*/ ctx[0]);
    			attr_dev(svg, "height", /*height*/ ctx[1]);
    			add_location(svg, file$1, 110, 2, 2578);
    			set_style(div1, "position", "relative");
    			add_location(div1, file$1, 81, 0, 1637);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			append_dev(div1, t0);
    			append_dev(div1, svg);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(svg, null);
    			}

    			insert_dev(target, t1, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*nodes, colors, accent, fmt, color*/ 236) {
    				each_value_1 = /*nodes*/ ctx[3];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*width*/ 1) {
    				set_style(div0, "width", /*width*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*height*/ 2) {
    				set_style(div0, "height", /*height*/ ctx[1] + "px");
    			}

    			if (dirty & /*paths*/ 16) {
    				each_value = /*paths*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(svg, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (!current || dirty & /*width, height*/ 3 && svg_viewBox_value !== (svg_viewBox_value = "0,0," + /*width*/ ctx[0] + "," + /*height*/ ctx[1])) {
    				attr_dev(svg, "viewBox", svg_viewBox_value);
    			}

    			if (!current || dirty & /*width*/ 1) {
    				attr_dev(svg, "width", /*width*/ ctx[0]);
    			}

    			if (!current || dirty & /*height*/ 2) {
    				attr_dev(svg, "height", /*height*/ ctx[1]);
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1024) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[10], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[10], dirty, null));
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $items;
    	validate_store(items, "items");
    	component_subscribe($$self, items, $$value => $$invalidate(9, $items = $$value));
    	let colors = spencerColor.colors;
    	let { width = 800 } = $$props;
    	let { height = 500 } = $$props;
    	let { nodeWidth = 120 } = $$props;

    	let { fmt = num => {
    		if (num >= 1000000) {
    			num = Math.round(num / 1000000) * 1000000;
    			return String(num / 1000000) + "m";
    		}

    		if (num > 1000) {
    			return String(num / 1000) + "k";
    		}

    		return String(num);
    	} } = $$props;

    	height = Number(height);
    	width = Number(width);
    	let nodes = [];
    	let paths = [];
    	let color = "steelblue";
    	let accent = "#d98b89";

    	onMount(() => {
    		
    		$$invalidate(3, { nodes, paths } = layout($items, width, height, nodeWidth), nodes, $$invalidate(4, paths));
    	}); // console.log(paths)

    	const writable_props = ["width", "height", "nodeWidth", "fmt"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Sankey> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Sankey", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("nodeWidth" in $$props) $$invalidate(8, nodeWidth = $$props.nodeWidth);
    		if ("fmt" in $$props) $$invalidate(2, fmt = $$props.fmt);
    		if ("$$scope" in $$props) $$invalidate(10, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		layout,
    		Dots,
    		items,
    		onMount,
    		c: spencerColor,
    		colors,
    		width,
    		height,
    		nodeWidth,
    		fmt,
    		nodes,
    		paths,
    		color,
    		accent,
    		$items
    	});

    	$$self.$inject_state = $$props => {
    		if ("colors" in $$props) $$invalidate(5, colors = $$props.colors);
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("nodeWidth" in $$props) $$invalidate(8, nodeWidth = $$props.nodeWidth);
    		if ("fmt" in $$props) $$invalidate(2, fmt = $$props.fmt);
    		if ("nodes" in $$props) $$invalidate(3, nodes = $$props.nodes);
    		if ("paths" in $$props) $$invalidate(4, paths = $$props.paths);
    		if ("color" in $$props) $$invalidate(6, color = $$props.color);
    		if ("accent" in $$props) $$invalidate(7, accent = $$props.accent);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		width,
    		height,
    		fmt,
    		nodes,
    		paths,
    		colors,
    		color,
    		accent,
    		nodeWidth,
    		$items,
    		$$scope,
    		$$slots
    	];
    }

    class Sankey extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-za3vrg-style")) add_css();

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			width: 0,
    			height: 1,
    			nodeWidth: 8,
    			fmt: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sankey",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get width() {
    		throw new Error("<Sankey>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Sankey>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Sankey>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Sankey>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nodeWidth() {
    		throw new Error("<Sankey>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nodeWidth(value) {
    		throw new Error("<Sankey>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fmt() {
    		throw new Error("<Sankey>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fmt(value) {
    		throw new Error("<Sankey>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Node.svelte generated by Svelte v3.22.2 */

    function create_fragment$2(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $colCount;
    	validate_store(colCount, "colCount");
    	component_subscribe($$self, colCount, $$value => $$invalidate(10, $colCount = $$value));
    	let { value = null } = $$props;
    	let { from = null } = $$props;
    	let { name = "" } = $$props;
    	let { full = "100" } = $$props;
    	let { to = "" } = $$props;
    	let { color = "steelblue" } = $$props;
    	let { accent = "#d98b89" } = $$props;
    	let { dy = "0" } = $$props;
    	let { dx = "0" } = $$props;
    	let { opacity = "1" } = $$props;

    	if (typeof value === "string") {
    		value = value.replace(/,/g, "");
    	}

    	let row = {
    		name,
    		to,
    		value: Number(value),
    		full: Number(full),
    		from,
    		dy: Number(dy),
    		dx: Number(dx),
    		color,
    		accent,
    		opacity,
    		col: $colCount
    	};

    	items.update(arr => {
    		arr.push(row);
    		return arr;
    	});

    	const writable_props = [
    		"value",
    		"from",
    		"name",
    		"full",
    		"to",
    		"color",
    		"accent",
    		"dy",
    		"dx",
    		"opacity"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Node> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Node", $$slots, []);

    	$$self.$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("from" in $$props) $$invalidate(1, from = $$props.from);
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    		if ("full" in $$props) $$invalidate(3, full = $$props.full);
    		if ("to" in $$props) $$invalidate(4, to = $$props.to);
    		if ("color" in $$props) $$invalidate(5, color = $$props.color);
    		if ("accent" in $$props) $$invalidate(6, accent = $$props.accent);
    		if ("dy" in $$props) $$invalidate(7, dy = $$props.dy);
    		if ("dx" in $$props) $$invalidate(8, dx = $$props.dx);
    		if ("opacity" in $$props) $$invalidate(9, opacity = $$props.opacity);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		items,
    		colCount,
    		value,
    		from,
    		name,
    		full,
    		to,
    		color,
    		accent,
    		dy,
    		dx,
    		opacity,
    		row,
    		$colCount
    	});

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("from" in $$props) $$invalidate(1, from = $$props.from);
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    		if ("full" in $$props) $$invalidate(3, full = $$props.full);
    		if ("to" in $$props) $$invalidate(4, to = $$props.to);
    		if ("color" in $$props) $$invalidate(5, color = $$props.color);
    		if ("accent" in $$props) $$invalidate(6, accent = $$props.accent);
    		if ("dy" in $$props) $$invalidate(7, dy = $$props.dy);
    		if ("dx" in $$props) $$invalidate(8, dx = $$props.dx);
    		if ("opacity" in $$props) $$invalidate(9, opacity = $$props.opacity);
    		if ("row" in $$props) row = $$props.row;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, from, name, full, to, color, accent, dy, dx, opacity];
    }

    class Node extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			value: 0,
    			from: 1,
    			name: 2,
    			full: 3,
    			to: 4,
    			color: 5,
    			accent: 6,
    			dy: 7,
    			dx: 8,
    			opacity: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Node",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get value() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get from() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set from(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get full() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set full(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get to() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set to(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get accent() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set accent(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dy() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dy(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dx() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dx(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get opacity() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set opacity(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const uuid$1 = function () {
      return 'xxxxxx'.replace(/[xy]/g, function (c) {
        let r = (Math.random() * 16) | 0; //eslint-disable-line
        let v = c === 'x' ? r : (r & 0x3) | 0x8; //eslint-disable-line
        return v.toString(16)
      })
    };

    /* src/Col.svelte generated by Svelte v3.22.2 */
    const file$2 = "src/Col.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			add_location(div, file$2, 11, 0, 191);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[1], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null));
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $colCount;
    	validate_store(colCount, "colCount");
    	component_subscribe($$self, colCount, $$value => $$invalidate(0, $colCount = $$value));
    	set_store_value(colCount, $colCount += 1);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Col> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Col", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		setContext,
    		getContext,
    		colCount,
    		uuid: uuid$1,
    		$colCount
    	});

    	return [$colCount, $$scope, $$slots];
    }

    class Col extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Col",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* Demo.svelte generated by Svelte v3.22.2 */
    const file$3 = "Demo.svelte";

    function add_css$1() {
    	var style = element("style");
    	style.id = "svelte-1o2k1lr-style";
    	style.textContent = ".m3.svelte-1o2k1lr{margin:3rem}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGVtby5zdmVsdGUiLCJzb3VyY2VzIjpbIkRlbW8uc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IFNhbmtleSwgTm9kZSwgQ29sIH0gZnJvbSAnLi9zcmMnXG4gIGxldCBmbXQgPSBudW0gPT4ge1xuICAgIG51bSA9IE51bWJlcihudW0pICogMTAwMDAwMFxuICAgIGlmIChudW0gPj0gMTAwMDAwMDAwMCkge1xuICAgICAgbnVtID0gTWF0aC5yb3VuZChudW0gLyAxMDAwMDAwMDApICogMTAwMDAwMDAwXG4gICAgICBudW0gPSBNYXRoLnJvdW5kKG51bSlcbiAgICAgIHJldHVybiBTdHJpbmcobnVtIC8gMTAwMDAwMDAwMCkgKyAnYidcbiAgICB9XG4gICAgaWYgKG51bSA+PSAxMDAwMDAwKSB7XG4gICAgICBudW0gPSBNYXRoLnJvdW5kKG51bSAvIDEwMDAwMCkgKiAxMDAwMDBcbiAgICAgIG51bSA9IE1hdGgucm91bmQobnVtKVxuICAgICAgcmV0dXJuIFN0cmluZyhudW0gLyAxMDAwMDAwKSArICdtJ1xuICAgIH1cbiAgICBpZiAobnVtID4gMTAwMCkge1xuICAgICAgbnVtID0gTWF0aC5yb3VuZChudW0gLyAxMDAwMCkgKiAxMDAwMFxuICAgICAgcmV0dXJuIFN0cmluZyhudW0gLyAxMDAwKSArICdrJ1xuICAgIH1cbiAgICByZXR1cm4gbnVtXG4gIH1cbjwvc2NyaXB0PlxuXG48c3R5bGU+XG4gIC5tMyB7XG4gICAgbWFyZ2luOiAzcmVtO1xuICB9XG48L3N0eWxlPlxuXG48ZGl2PlxuICA8ZGl2IGNsYXNzPVwibTNcIj5cbiAgICA8Yj5Ub3JvbnRvIENpdHkgQnVkZ2V0PC9iPlxuICAgIDxiciAvPlxuICAgIGluIDIwMjBcbiAgPC9kaXY+XG5cbiAgPFNhbmtleSBoZWlnaHQ9XCI4MDBcIiB7Zm10fT5cbiAgICA8Q29sPlxuICAgICAgPE5vZGUgbmFtZT1cIlByb3BlcnR5IFRheGVzXCIgdG89XCJUb3JvbnRvXCIgdmFsdWU9XCI0NDAwXCIgY29sb3I9XCJzZWFcIiAvPlxuICAgICAgPE5vZGUgbmFtZT1cIlByb3ZpbmNlL0ZlZFwiIHRvPVwiVG9yb250b1wiIHZhbHVlPVwiMjUwMFwiIGNvbG9yPVwicmVkXCIgLz5cbiAgICAgIDxOb2RlIG5hbWU9XCJUVEMgRmFyZXNcIiB0bz1cIlRvcm9udG9cIiB2YWx1ZT1cIjEzMDBcIiBjb2xvcj1cInNreVwiIC8+XG4gICAgICA8Tm9kZSBuYW1lPVwiRmVlc1wiIHRvPVwiVG9yb250b1wiIHZhbHVlPVwiOTAwXCIgY29sb3I9XCJza3lcIiAvPlxuICAgICAgPE5vZGUgbmFtZT1cIkxhbmQtdHJhbnNmZXJcIiB0bz1cIlRvcm9udG9cIiB2YWx1ZT1cIjgwMFwiIGNvbG9yPVwic2t5XCIgLz5cbiAgICAgIDxOb2RlIG5hbWU9XCJNaXNjXCIgdG89XCJUb3JvbnRvXCIgdmFsdWU9XCI2MDBcIiBjb2xvcj1cInNlYVwiIC8+XG4gICAgICA8Tm9kZSBuYW1lPVwiSW52ZXN0bWVudFwiIHRvPVwiVG9yb250b1wiIHZhbHVlPVwiMzAwXCIgY29sb3I9XCJzZWFcIiAvPlxuICAgICAgPE5vZGUgbmFtZT1cIlJlc2VydmVzXCIgdG89XCJUb3JvbnRvXCIgdmFsdWU9XCI1MDBcIiBjb2xvcj1cInNlYVwiIC8+XG4gICAgICA8Tm9kZSBuYW1lPVwiVHJhbnNmZXJzXCIgdG89XCJUb3JvbnRvXCIgdmFsdWU9XCIzMDBcIiBjb2xvcj1cInNlYVwiIC8+XG5cbiAgICA8L0NvbD5cbiAgICA8Q29sPlxuICAgICAgPE5vZGUgbmFtZT1cIlRvcm9udG9cIiB2YWx1ZT1cIjExNjAwXCIgY29sb3I9XCJibHVlXCIgZnVsbD1cIjg3LjJcIiAvPlxuICAgIDwvQ29sPlxuICAgIDxDb2w+XG4gICAgICA8Tm9kZVxuICAgICAgICBuYW1lPVwiU29jaWFsIFByb2dyYW1zXCJcbiAgICAgICAgZnJvbT1cIlRvcm9udG9cIlxuICAgICAgICB2YWx1ZT1cIjMzMDBcIlxuICAgICAgICBjb2xvcj1cIiM2RTk1ODhcIiAvPlxuICAgICAgPE5vZGUgbmFtZT1cIlRUQ1wiIGZyb209XCJUb3JvbnRvXCIgdmFsdWU9XCIyMTAwXCIgY29sb3I9XCJyZWRcIiAvPlxuICAgICAgPE5vZGUgbmFtZT1cIkVtc1wiIGZyb209XCJUb3JvbnRvXCIgdmFsdWU9XCIyMDAwXCIgY29sb3I9XCIjQ0RBREQ5XCIgLz5cbiAgICAgIDxOb2RlIG5hbWU9XCJGaW5hbmNpbmdcIiBmcm9tPVwiVG9yb250b1wiIHZhbHVlPVwiMTAwMFwiIGNvbG9yPVwic2VhXCIgLz5cbiAgICAgIDxOb2RlIG5hbWU9XCJPcGVyYXRpb25zXCIgZnJvbT1cIlRvcm9udG9cIiB2YWx1ZT1cIjkwMFwiIGNvbG9yPVwic2VhXCIgLz5cbiAgICAgIDxOb2RlIG5hbWU9XCJTZXJ2aWNlc1wiIGZyb209XCJUb3JvbnRvXCIgdmFsdWU9XCI3MDBcIiBjb2xvcj1cInNlYVwiIC8+XG4gICAgICA8Tm9kZSBuYW1lPVwiQWNjb3VudHNcIiBmcm9tPVwiVG9yb250b1wiIHZhbHVlPVwiNzAwXCIgY29sb3I9XCJzZWFcIiAvPlxuICAgICAgPE5vZGUgbmFtZT1cIlRyYW5zcG9ydGF0aW9uXCIgZnJvbT1cIlRvcm9udG9cIiB2YWx1ZT1cIjQwMFwiIGNvbG9yPVwic2VhXCIgLz5cbiAgICAgIDxOb2RlIG5hbWU9XCJPdGhlclwiIGZyb209XCJUb3JvbnRvXCIgdmFsdWU9XCI0MDBcIiBjb2xvcj1cInNlYVwiIC8+XG5cbiAgICAgIDwhLS0gXG5cbiAgICAgIDxOb2RlIG5hbWU9XCJQb2xpY2VcIiBmcm9tPVwiVG9yb250b1wiIHZhbHVlPVwiMTEzMFwiIGNvbG9yPVwic2VhXCIgLz5cbiAgICAgIDxOb2RlXG4gICAgICAgIG5hbWU9XCJUVENcIlxuICAgICAgICBmcm9tPVwiVG9yb250b1wiXG4gICAgICAgIHZhbHVlPVwiMjEwMFwiXG4gICAgICAgIGNvbG9yPVwiIzZFOTU4OFwiXG4gICAgICAgIGFjY2VudD1cImxpZ2h0c3RlZWxibHVlXCIgLz5cbiAgICAgIDxOb2RlIG5hbWU9XCJGaXJlXCIgZnJvbT1cIlRvcm9udG9cIiB2YWx1ZT1cIjQ3OVwiIGNvbG9yPVwicmVkXCIgLz5cbiAgICAgIDxOb2RlIG5hbWU9XCJTb2NpYWwgUHJvZ3JhbXNcIiBmcm9tPVwiVG9yb250b1wiIHZhbHVlPVwiMzMwMFwiIGNvbG9yPVwicmVkXCIgLz5cbiAgICAgIDxOb2RlIG5hbWU9XCJTZXJ2aWNlc1wiIGZyb209XCJUb3JvbnRvXCIgdmFsdWU9XCIxOTQwXCIgY29sb3I9XCJyZWRcIiAvPiAtLT5cbiAgICA8L0NvbD5cblxuICA8L1NhbmtleT5cblxuPC9kaXY+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBdUJFLEdBQUcsZUFBQyxDQUFDLEFBQ0gsTUFBTSxDQUFFLElBQUksQUFDZCxDQUFDIn0= */";
    	append_dev(document.head, style);
    }

    // (37:4) <Col>
    function create_default_slot_3(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let current;

    	const node0 = new Node({
    			props: {
    				name: "Property Taxes",
    				to: "Toronto",
    				value: "4400",
    				color: "sea"
    			},
    			$$inline: true
    		});

    	const node1 = new Node({
    			props: {
    				name: "Province/Fed",
    				to: "Toronto",
    				value: "2500",
    				color: "red"
    			},
    			$$inline: true
    		});

    	const node2 = new Node({
    			props: {
    				name: "TTC Fares",
    				to: "Toronto",
    				value: "1300",
    				color: "sky"
    			},
    			$$inline: true
    		});

    	const node3 = new Node({
    			props: {
    				name: "Fees",
    				to: "Toronto",
    				value: "900",
    				color: "sky"
    			},
    			$$inline: true
    		});

    	const node4 = new Node({
    			props: {
    				name: "Land-transfer",
    				to: "Toronto",
    				value: "800",
    				color: "sky"
    			},
    			$$inline: true
    		});

    	const node5 = new Node({
    			props: {
    				name: "Misc",
    				to: "Toronto",
    				value: "600",
    				color: "sea"
    			},
    			$$inline: true
    		});

    	const node6 = new Node({
    			props: {
    				name: "Investment",
    				to: "Toronto",
    				value: "300",
    				color: "sea"
    			},
    			$$inline: true
    		});

    	const node7 = new Node({
    			props: {
    				name: "Reserves",
    				to: "Toronto",
    				value: "500",
    				color: "sea"
    			},
    			$$inline: true
    		});

    	const node8 = new Node({
    			props: {
    				name: "Transfers",
    				to: "Toronto",
    				value: "300",
    				color: "sea"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(node0.$$.fragment);
    			t0 = space();
    			create_component(node1.$$.fragment);
    			t1 = space();
    			create_component(node2.$$.fragment);
    			t2 = space();
    			create_component(node3.$$.fragment);
    			t3 = space();
    			create_component(node4.$$.fragment);
    			t4 = space();
    			create_component(node5.$$.fragment);
    			t5 = space();
    			create_component(node6.$$.fragment);
    			t6 = space();
    			create_component(node7.$$.fragment);
    			t7 = space();
    			create_component(node8.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(node0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(node1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(node2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(node3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(node4, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(node5, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(node6, target, anchor);
    			insert_dev(target, t6, anchor);
    			mount_component(node7, target, anchor);
    			insert_dev(target, t7, anchor);
    			mount_component(node8, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(node0.$$.fragment, local);
    			transition_in(node1.$$.fragment, local);
    			transition_in(node2.$$.fragment, local);
    			transition_in(node3.$$.fragment, local);
    			transition_in(node4.$$.fragment, local);
    			transition_in(node5.$$.fragment, local);
    			transition_in(node6.$$.fragment, local);
    			transition_in(node7.$$.fragment, local);
    			transition_in(node8.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(node0.$$.fragment, local);
    			transition_out(node1.$$.fragment, local);
    			transition_out(node2.$$.fragment, local);
    			transition_out(node3.$$.fragment, local);
    			transition_out(node4.$$.fragment, local);
    			transition_out(node5.$$.fragment, local);
    			transition_out(node6.$$.fragment, local);
    			transition_out(node7.$$.fragment, local);
    			transition_out(node8.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(node0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(node1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(node2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(node3, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(node4, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(node5, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(node6, detaching);
    			if (detaching) detach_dev(t6);
    			destroy_component(node7, detaching);
    			if (detaching) detach_dev(t7);
    			destroy_component(node8, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(37:4) <Col>",
    		ctx
    	});

    	return block;
    }

    // (49:4) <Col>
    function create_default_slot_2(ctx) {
    	let current;

    	const node = new Node({
    			props: {
    				name: "Toronto",
    				value: "11600",
    				color: "blue",
    				full: "87.2"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(node.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(node, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(node.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(node.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(node, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(49:4) <Col>",
    		ctx
    	});

    	return block;
    }

    // (52:4) <Col>
    function create_default_slot_1(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let current;

    	const node0 = new Node({
    			props: {
    				name: "Social Programs",
    				from: "Toronto",
    				value: "3300",
    				color: "#6E9588"
    			},
    			$$inline: true
    		});

    	const node1 = new Node({
    			props: {
    				name: "TTC",
    				from: "Toronto",
    				value: "2100",
    				color: "red"
    			},
    			$$inline: true
    		});

    	const node2 = new Node({
    			props: {
    				name: "Ems",
    				from: "Toronto",
    				value: "2000",
    				color: "#CDADD9"
    			},
    			$$inline: true
    		});

    	const node3 = new Node({
    			props: {
    				name: "Financing",
    				from: "Toronto",
    				value: "1000",
    				color: "sea"
    			},
    			$$inline: true
    		});

    	const node4 = new Node({
    			props: {
    				name: "Operations",
    				from: "Toronto",
    				value: "900",
    				color: "sea"
    			},
    			$$inline: true
    		});

    	const node5 = new Node({
    			props: {
    				name: "Services",
    				from: "Toronto",
    				value: "700",
    				color: "sea"
    			},
    			$$inline: true
    		});

    	const node6 = new Node({
    			props: {
    				name: "Accounts",
    				from: "Toronto",
    				value: "700",
    				color: "sea"
    			},
    			$$inline: true
    		});

    	const node7 = new Node({
    			props: {
    				name: "Transportation",
    				from: "Toronto",
    				value: "400",
    				color: "sea"
    			},
    			$$inline: true
    		});

    	const node8 = new Node({
    			props: {
    				name: "Other",
    				from: "Toronto",
    				value: "400",
    				color: "sea"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(node0.$$.fragment);
    			t0 = space();
    			create_component(node1.$$.fragment);
    			t1 = space();
    			create_component(node2.$$.fragment);
    			t2 = space();
    			create_component(node3.$$.fragment);
    			t3 = space();
    			create_component(node4.$$.fragment);
    			t4 = space();
    			create_component(node5.$$.fragment);
    			t5 = space();
    			create_component(node6.$$.fragment);
    			t6 = space();
    			create_component(node7.$$.fragment);
    			t7 = space();
    			create_component(node8.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(node0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(node1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(node2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(node3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(node4, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(node5, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(node6, target, anchor);
    			insert_dev(target, t6, anchor);
    			mount_component(node7, target, anchor);
    			insert_dev(target, t7, anchor);
    			mount_component(node8, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(node0.$$.fragment, local);
    			transition_in(node1.$$.fragment, local);
    			transition_in(node2.$$.fragment, local);
    			transition_in(node3.$$.fragment, local);
    			transition_in(node4.$$.fragment, local);
    			transition_in(node5.$$.fragment, local);
    			transition_in(node6.$$.fragment, local);
    			transition_in(node7.$$.fragment, local);
    			transition_in(node8.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(node0.$$.fragment, local);
    			transition_out(node1.$$.fragment, local);
    			transition_out(node2.$$.fragment, local);
    			transition_out(node3.$$.fragment, local);
    			transition_out(node4.$$.fragment, local);
    			transition_out(node5.$$.fragment, local);
    			transition_out(node6.$$.fragment, local);
    			transition_out(node7.$$.fragment, local);
    			transition_out(node8.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(node0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(node1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(node2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(node3, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(node4, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(node5, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(node6, detaching);
    			if (detaching) detach_dev(t6);
    			destroy_component(node7, detaching);
    			if (detaching) detach_dev(t7);
    			destroy_component(node8, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(52:4) <Col>",
    		ctx
    	});

    	return block;
    }

    // (36:2) <Sankey height="800" {fmt}>
    function create_default_slot(ctx) {
    	let t0;
    	let t1;
    	let current;

    	const col0 = new Col({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const col1 = new Col({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const col2 = new Col({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(col0.$$.fragment);
    			t0 = space();
    			create_component(col1.$$.fragment);
    			t1 = space();
    			create_component(col2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(col0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(col1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(col2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const col0_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				col0_changes.$$scope = { dirty, ctx };
    			}

    			col0.$set(col0_changes);
    			const col1_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				col1_changes.$$scope = { dirty, ctx };
    			}

    			col1.$set(col1_changes);
    			const col2_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				col2_changes.$$scope = { dirty, ctx };
    			}

    			col2.$set(col2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(col0.$$.fragment, local);
    			transition_in(col1.$$.fragment, local);
    			transition_in(col2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(col0.$$.fragment, local);
    			transition_out(col1.$$.fragment, local);
    			transition_out(col2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(col0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(col1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(col2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(36:2) <Sankey height=\\\"800\\\" {fmt}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div1;
    	let div0;
    	let b;
    	let t1;
    	let br;
    	let t2;
    	let t3;
    	let current;

    	const sankey = new Sankey({
    			props: {
    				height: "800",
    				fmt: /*fmt*/ ctx[0],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			b = element("b");
    			b.textContent = "Toronto City Budget";
    			t1 = space();
    			br = element("br");
    			t2 = text("\n    in 2020");
    			t3 = space();
    			create_component(sankey.$$.fragment);
    			add_location(b, file$3, 30, 4, 629);
    			add_location(br, file$3, 31, 4, 660);
    			attr_dev(div0, "class", "m3 svelte-1o2k1lr");
    			add_location(div0, file$3, 29, 2, 608);
    			add_location(div1, file$3, 28, 0, 600);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, b);
    			append_dev(div0, t1);
    			append_dev(div0, br);
    			append_dev(div0, t2);
    			append_dev(div1, t3);
    			mount_component(sankey, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const sankey_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				sankey_changes.$$scope = { dirty, ctx };
    			}

    			sankey.$set(sankey_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sankey.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sankey.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(sankey);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let fmt = num => {
    		num = Number(num) * 1000000;

    		if (num >= 1000000000) {
    			num = Math.round(num / 100000000) * 100000000;
    			num = Math.round(num);
    			return String(num / 1000000000) + "b";
    		}

    		if (num >= 1000000) {
    			num = Math.round(num / 100000) * 100000;
    			num = Math.round(num);
    			return String(num / 1000000) + "m";
    		}

    		if (num > 1000) {
    			num = Math.round(num / 10000) * 10000;
    			return String(num / 1000) + "k";
    		}

    		return num;
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Demo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Demo", $$slots, []);
    	$$self.$capture_state = () => ({ Sankey, Node, Col, fmt });

    	$$self.$inject_state = $$props => {
    		if ("fmt" in $$props) $$invalidate(0, fmt = $$props.fmt);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [fmt];
    }

    class Demo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-1o2k1lr-style")) add_css$1();
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Demo",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    const app = new Demo({
      target: document.body,
      props: {},
    });

    return app;

}());
