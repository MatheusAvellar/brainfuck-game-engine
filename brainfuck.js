/*
 * Full credits to <https://github.com/copy/>
 * for the initial code for the compiler (available
 * online at <https://copy.sh/brainfuck/>)
 *
 * I will most likely finish replacing the compiler
 * in the future with one fully built by myself.
 * However, for the moment, this should do nicely.
 *
 * I highly recommend a visit to copy's GitHub,
 * everything is awesome in there.
 */

"use strict";

var COMPILED = false;

var HAS_WINDOW = COMPILED || typeof window !== "undefined";

var run_button = document.getElementById("run");

var $ = function(id) {
    return document.getElementById(id);
},

set_child = function(obj, new_child) {
    while(obj.firstChild)
        obj.removeChild(obj.firstChild);

    obj.appendChild(new_child);
},

set_text = function(id, text) {
    set_child($(id), document.createTextNode(text));
},

number_format = function(num) {
    num = String(num);
    for(var length = num.length - 3; length > 0; length -= 3)
        num = num.substring(0, length) + "." + num.substring(length);
    return num;
},

braincoitus = function(code) {
    let i, limit = 5e4;
    code = code.replace(/[^\{\}0-9\[\]\+\-\.\,\>\<]/g,"");

    while((i = code.indexOf("{")) != -1 && code.indexOf("}") != -1) {
        if(--limit < 0) return false;
        let len,
            count = "",
            operation = code[++i],
            new_str,
            _code = code;

        if(/[^\+\-\.\,\>\<]/g.test(operation)) {
            set_text("status", "[braincoitus] Invalid op '" + code[i] + "'");
            return false;
        }

        for(;code[++i]&&code[i] != "}";) count += code[i];

        if(count.trim().length == 0 || isNaN(len = +count)) {
            set_text("status", "[braincoitus] '" + count + "' is NaN");
            return false;
        }

        for(count = len, new_str = ""; count --> 0;) new_str += operation;

        code = code.replace("{" + operation + len + "}", new_str);

        if(_code == code && len>=0)
            code = code.replace("{" + operation + "+" + len + "}", new_str);
        if(_code == code && !len)
            code = code.replace("{" + operation + "}", new_str);
    }
    return code.replace(/[\{\}0-9]/g,"");
},

done = function(code) {
    require("electron").ipcRenderer.sendSync("run-game", {
        tape: tape,
        update: code
    });
},

    domLoaded;


function main() {
    var cell_size = 8,
        memory_size = 1e4,
        worker,
        running = false,
        start_time,
        time_message,
        current_code

    if(domLoaded) return;

    domLoaded = true;

    make_worker();

    add_event(run_button, "click", function() { execute(); });

    /*add_event(stop_button, "click", function() {
        if(running) {
            running = false;
            if(worker) {
                worker.terminate();
                make_worker();
            }
            run_button.className = "active_button";
            stop_button.className = "inactive_button";
            set_text("status", "Halted.");
        }
    });*/


    function handle_result(result) {
        if(result["s"]) {
            running = false;

            run_button.className = "active_button";
            stop_button.className = "inactive_button";

            if(result["s"] === -1) {
                
                //done();
            } else {
                var text;

                switch(result["s"]) {
                    case 3:
                        text = "Memory border overflow";
                        break;
                    case 4:
                        text = "Memory border underflow";
                        break;
                    default: break;
                }
                var pos = get_line_char(current_code, result["k"]);

                set_text("status", "Warning: " + text +  " in line " + pos.line + " char " + pos.chr + ".");
            }

            current_code = "";
        }
    }

    function make_worker() {
        function the_worker() {
            self.addEventListener("message", function (event) {
                (new Function("", event.data.generated_code))();
            }, false);
        }

        var blob = new Blob(["(", the_worker.toString(), ")()"], { type: "application/javascript" });
        var blob_url = URL.createObjectURL(blob);

        worker = new Worker(blob_url);

        worker["onmessage"] = function(e) {  handle_result(e.data);  };
    }

    function execute() {
        if(running) {
            return;
        }

        start_time = Date.now();
        let mem_obj = {  cell_size, memory_size  };

        current_code = braincoitus($("load-code").value);
        if(current_code === false) return;

        let load_code = braincoitus($("load-code").value).split("");

        let load_result = run_bf(load_code, "", mem_obj);
        if (load_result.error) return set_text("status", load_result.error.message);


        current_code = braincoitus($("update-code").value);
        if(current_code === false) return;

        let update_code = braincoitus($("update-code").value).split("");

        let update_result = run_bf(update_code, "", mem_obj);
        if (update_result.error) return set_text("status", update_result.error.message);

        time_message = "Compilation time: " + number_format(Date.now() - start_time) + "ms";

        start_time = Date.now();
        set_text("status", "Running load code");
        (new Function("", load_result.ok.generated_code))();
        let result_time = Date.now() - start_time;
        set_text("status", time_message + " | Load time: " + number_format(result_time) + "ms");
        console.log("LOAD:");
        console.log(load_result.ok.generated_code);
        console.log("UPDATE:");
        console.log(update_result.ok.generated_code);
        running = false;
        /* DONE */
        done(update_result.ok.generated_code);
    }
};

function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}

function inverse_mod(n, m) {
    var inv1 = 1,
        inv2 = 0,
        tmp;

    while(m != 1) {
        tmp = inv1;
        inv1 = inv2;
        inv2 = tmp - inv2 * (n / m | 0);

        tmp = n;
        n = m;
        m = tmp % m;
    }

    return inv2;
}

function search(array, needle, start) {
    for(var i = start || 0; i < array.length; i++) {
        if(array[i] === needle) {
            return i;
        }
    }

    return -1;
}

if(COMPILED || typeof window !== "undefined") {
    var add_event = window.addEventListener
        ? function(obj, evtname, func) {
            if(obj instanceof Array)
                for(var i = 0; i < obj.length; i++)
                    obj[i].addEventListener(evtname, func, false);
            else
                obj.addEventListener(evtname, func, false);
        }
        : function(obj, evtname, func) {
            if(obj instanceof Array)
                for(var i = 0; i < obj.length; i++)
                    obj[i].attachEvent("on" + evtname, func);
            else
                obj.attachEvent("on" + evtname, func);
        };

    domLoaded = (typeof window !== "undefined" || COMPILED) && (typeof document.readyState === "undefined" ? !!document.getElementsByTagName("body")[0] : (document.readyState === "loaded" || document.readyState === "complete"));

    if(!domLoaded) {
        add_event(document, "DOMContentLoaded", main);
        add_event(window, "load", main);
    } else {
        domLoaded = false;
        main();
    }
} else if(typeof module === "object") {
    module.exports = {
        run_bf
    };
}

function run_bf(code, input_str, config) {
    var len = code.length,
        brackets = 0,
        pointer_offset = [0],
        js_code = "",
        js_code_head = "",
        last_open_bracket,
        bf_commands = "<>+-,.[]",
        cell_max_value = Math.pow(2, config.cell_size) - 1;

    function p() {
        var offset = pointer_offset[pointer_offset.length - 1];
        return p_with(offset);
    }

    function p_with(n) {
        var result = "p" + (n > 0 ? "+" + n : (n === 0 ? "" : n));

        return "u(" + result + ")";
    }

    function p2(n) {
        return n > 0 ? "p+=" + n + ";" : (n === 0 ? "" : "p-=" + (-n) + ";");
    }

    for(var i = 0; i < len; i++) {
        var k = i;

        switch(code[i]) {
            case "+":
            case "-":
                for(var times = 1; i < len; i++) {
                    if(code[i + 1] === code[k]) {
                        times++;
                    } else if(bf_commands.indexOf(code[i + 1]) !== -1) {
                        break;
                    }
                }
                break;
            default: break;
        }

        if(code[k] === "+") {
            if(times === 1)
                js_code += "m[" + p() + "]++;";
            else
                js_code += "m[" + p() + "]+=" + times + ";";
        } else if(code[k] === "-") {
            if(times === 1)
                js_code += "m[" + p() + "]--;";
            else
                js_code += "m[" + p() + "]-=" + times + ";";
        } else if(code[k] === ">") {
            pointer_offset[pointer_offset.length - 1]++;
        } else if(code[k] === "<") {
            pointer_offset[pointer_offset.length - 1]--;
        } else if(code[k] === "[") {
            var next_bracket = search(code, "]", i),
                skip_loop = false;

            if(next_bracket !== -1
            && next_bracket < (search(code, "[", i + 1) + 1 || 1e9)
            && next_bracket < (search(code, ".", i) + 1 || 1e9)
            && next_bracket < (search(code, ",", i) + 1 || 1e9)) {
                var relative_cells = { 0: cell_max_value + 1 },
                    offset = 0;

                for(var l = 1; l < next_bracket - i; l++) {
                    var chr = code[i + l];

                    if(chr === "+") {
                        relative_cells[offset]++;
                    } else if(chr === "-") {
                        relative_cells[offset]--;
                    } else if(chr === "<") {
                        offset--;
                        if(!relative_cells[offset]) {
                            relative_cells[offset] = 0;
                        }
                    } else if(chr === ">") {
                        offset++;
                        if(!relative_cells[offset]) {
                            relative_cells[offset] = 0;
                        }
                    }
                }

                if(offset === 0 && gcd(relative_cells[0], cell_max_value + 1) === 1) {
                    js_code += "if((_=m[" + p() + "])!==0){";

                    skip_loop = true;

                    var inverse = -inverse_mod(relative_cells[0], cell_max_value + 1) + cell_max_value + 1;

                    for(l in relative_cells) {
                        l = Number(l);

                        if(l !== 0 && relative_cells[l] !== 0) {
                            var fac = relative_cells[l] * inverse % (cell_max_value + 1);

                            js_code += "m[" + p_with(pointer_offset[pointer_offset.length - 1] + l) + "]+=_" + (fac === 1 ? "" : "*" + fac) + ";";
                        }
                    }

                    js_code += "m[" + p() + "]=0;}";
                    i = next_bracket;
                }
            }

            if(!skip_loop) {
                js_code += "while(m[" + p() + "]!==0){";
                pointer_offset.push(pointer_offset[pointer_offset.length - 1]);
                brackets++;
                last_open_bracket = i + 1;
            }
        } else if(code[k] === "]") {

            js_code += p2(pointer_offset.pop() - pointer_offset[pointer_offset.length - 1]) + "}";

            if(brackets-- === 0) {
                var pos = get_line_char(code, i);

                return {
                    error: {
                        pos,
                        message: "Syntax error: Unexpected closing bracket in line " + pos.line + " char " + pos.chr + ".",
                    },
                };
            }
        } else if(code[k] === ",") {
            /* INPUT */
            js_code += "m["+p()+"]=i(m[" + p() + "]);";
        } else if(code[k] === ".") {
            /* OUTPUT */
            js_code += "q(m);";
        }
    }

    if(js_code.length > 0) {
        js_code += "return m;";

        if(brackets > 0) {
            var pos = get_line_char(code, last_open_bracket);

            return {
                error: {
                    pos,
                    message: "Syntax error: Unclosed bracket in line " + pos.line + " char " + pos.chr + ".",
                }
            };
        }

        var input = [];

        for(i = input_str.length - 1; i >= 0; i--) {
            input.push(input_str.charCodeAt(i));
        }

        js_code_head = "'use strict';let _,o=[],c=0,p=0,j=0,t=0,";
        js_code_head += "m=new Uint" + config.cell_size + "Array(" + config.memory_size + ");"
        js_code_head += "t=tape.length;while(t--)m[t]=tape[t]||0;";
        js_code_head += "function q(g){t=g.length;while(t--)tape[t]=g[t]||0}"
                      + "function u(n){n=n%" + config.memory_size + ";return n<0?n+" + config.memory_size + ":n}"
                      + "function i(n){n=~~n%9;if(n===0)return key.l;if(n===1)return key.u;if(n===2)return key.r;if(n===3)return key.d;if(n===4)return key.a;if(n===5)return key.s;if(n===6)return mse.x;if(n===7)return mse.y;if(n===8)return mse.c}";

        return {
            ok: {
                generated_code: js_code_head + js_code,
                argument_names: "",
                args: [],
            },
        };
    }
    return {
        ok: {  generated_code: "", argument_names: "", args: [],  },
    };
}

function get_line_char(text, index) {
    var result = { line: 1, chr: 0 };

    for(var i = 0; i < index; i++) {
        if(text[i] === "\n") {
            result.line++;
            result.chr = 0;
        } else {
            result.chr++;
        }
    }

    return result;
}

/*
0. Left arrow             => (0 = unpressed, 1 = pressed)
1. Up arrow               => (0 = unpressed, 1 = pressed)
2. Right arrow            => (0 = unpressed, 1 = pressed)
3. Down arrow             => (0 = unpressed, 1 = pressed)
4. 'A' key                => (0 = unpressed, 1 = pressed)
5. 'S' key                => (0 = unpressed, 1 = pressed)
6. X coordinate of mouse  => (0 to 25)
7. Y coordinate of mouse  => (0 to 19)
8. Mouse click            => (0 = unpressed, 1 = pressed)

0 - No change (shows the background color)
1 - Black (#333)
2 - Gray  (#ccc)
3 - White (#fff)
4 - Red   (#c33)
5 - Green (#3c3)
6 - Blue  (#33c)

*/