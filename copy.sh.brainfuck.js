/*
 *  Full credits to <https://github.com/copy/>
 *  for the code for this compiler. (available
 *  online at <https://copy.sh/brainfuck/>)
 *
 *  I will most likely replace it in the future
 *  with one I build myself. However, for the
 *  moment, this should do nicely.
 *
 *  I highly recommend a visit to that guy's
 *  GitHub, everything is awesome in there.
 */

"use strict";

var COMPILED = false;

var HAS_WINDOW = COMPILED || typeof window !== "undefined";

var run_button = document.getElementById("run");
var stop_button = document.getElementById("stop");

var

$ = function(id)
{
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
    domLoaded;


function main() {
    var cell_size = 8,
        memory_size = 10000,
        worker,
        running = false,
        start_time,
        time_message,
        current_code

    if(domLoaded) {
        return;
    }

    domLoaded = true;

    make_worker();

    add_event(run_button, "click", function() { execute(); });

    add_event(stop_button, "click", function() {
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
    });


    function handle_result(result) {
        if(result["s"]) {
            var result_time = Date.now() - start_time;
            running = false;

            run_button.className = "active_button";
            stop_button.className = "inactive_button";

            if(result["s"] === -1) {
                set_text("status", time_message + " | Execution time: " + number_format(result_time) + "ms");
                done();
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

        if(result["o"] && "t" in result) {
            /* OUTPUT */
            window.tape = result["t"];
        }
    }

    function make_worker() {
        function the_worker() {
            self.addEventListener("message", function (event) {
                (new Function("", event.data.generated_code))();
            }, false);
        }

        var blob = new Blob(["(", the_worker.toString(), ")()"], { type: 'application/javascript' });
        var blob_url = URL.createObjectURL(blob);

        worker = new Worker(blob_url);

        worker["onmessage"] = function(e) {  handle_result(e.data);  };
    }

    function execute() {
        if(running) {
            return;
        }

        current_code = $("load-code").value;
        var code = $("load-code").value.split("");
        var input_str = "";

        start_time = Date.now();

        var result = run_bf(code, input_str, {
            cell_size,
            memory_size
        });

        time_message = "Compilation time: " + number_format(Date.now() - start_time) + "ms";

        if(result.error) {
            set_text("status", result.error.message);
        } else {
            start_time = Date.now();
            worker.postMessage(result.ok);
            console.log(result.ok.generated_code);
            running = true;
            $("run").className = "inactive_button";
            $("stop").className = "active_button";
            set_text("status", "Running ...");
        }
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
        : function(obj, evtname, func)
        {
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
} else {
    if(typeof module === "object") {
        module.exports = {
            run_bf
        };
    }
}

function run_bf(code, input_str, config) {
    var len = code.length,
        brackets = 0,
        pointer_offset = [0],
        js_code = "",
        js_code_head = "",
        last_open_bracket,
        bf_commands = "<>+-,.[]",
        cell_max_value = Math.pow(2, config.cell_size) - 1,
        use_typed_arrays = "ArrayBuffer" in (HAS_WINDOW ? window : global);

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
            if(use_typed_arrays) {
                if(times === 1)
                    js_code += "m[" + p() + "]++;";
                else
                    js_code += "m[" + p() + "]+=" + times + ";";
            } else {
                if(times === 1)
                    js_code += "m[" + p() + "]===" + cell_max_value + "?(m[" + p() + "]=0):m[" + p() + "]++;";
                else
                    js_code += "m[" + p() + "]=m[" + p() + "]>" + (cell_max_value - times) + "?(m[" + p() + "]+" + times + ")%" + (cell_max_value + 1) + ":m[" + p() + "]+" + times + ";";
            }
        } else if(code[k] === "-") {
            if(use_typed_arrays) {
                if(times === 1)
                    js_code += "m[" + p() + "]--;";
                else
                    js_code += "m[" + p() + "]-=" + times + ";";
            } else {
                if(times === 1)
                    js_code += "m[" + p() + "]===0?(m[" + p() + "]=" + cell_max_value + "):m[" + p() + "]--;";
                else
                    js_code += "m[" + p() + "]=m[" + p() + "]<" + times + "?" + (cell_max_value - times + 1) + "+m[" + p() + "]:m[" + p() + "]-" + times + ";";
            }
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

                            js_code += "m[" + p_with(pointer_offset[pointer_offset.length - 1] + l) + "]+=_" + (fac === 1 ? "" : "*" + fac);

                            if(!use_typed_arrays) {
                                js_code += "%" + (cell_max_value + 1);
                            }

                            js_code += ";";
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
            //js_code += "i.length&&(m[" + p() + "]=i.pop());";
        } else if(code[k] === ".") {
            /* OUTPUT */
            js_code += "q(m[" + p() + "], m);";
        }
    }

    js_code += "return self.postMessage({s:-1,o:o,c:c,m:m,p:" + p() + ",n:-1});";

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

    js_code_head = "'use strict';var _,o=[],c=0,p=0,j=0,";
    js_code_head += "i=" + JSON.stringify(input) + ",";

    if(use_typed_arrays) {
        js_code_head += "m=new Uint" + config.cell_size + "Array(" + config.memory_size + ");"
    } else {
        js_code_head += "m=[0];";
    }

    js_code_head += "function q(i,t){self.postMessage({o:[i], t:t})}"
                  + "function u(n){n=n%" + config.memory_size + ";return n<0?n+" + config.memory_size + ":n}";

    return {
        ok: {
            generated_code: js_code_head + js_code,
            argument_names: "",
            args: [],
        },
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

>>>>> >>>>> >>>>> >>>>> >>>>> >>>>> >>>>> >>>>> >>>>> >>>>>
>>>>> >>>>> >>>>> >>>>> >>>>> >>>>> >>>>> >>>>> >>>>> >>>>>
>>>>> >>>>> >>>>> >>>>> >>>>> >>>>> >>>>> >>>>> >>>>> >>>>>
>>>>>
>>    (157) +
>     (158) +

>>>>> >>>>> >>>>> >>>>> >>>>>
>     (184) +

>>>>> >>>>> >>>>> >>>>> >>>>>
>     (210) +

>>>>> >>>>> >>>>>
>> >> (229) +
>     (230) +
>>>>> (235) +

>>>>> >>>>> >>>>> >>>>> >>>>>
      (260) +

>>>>> >>>>> >>>>> >>>>> >>>>>
      (285) +

>>>>> >>>>> >>>>> >>>>> >>>>>
      (310) +

>>>>> >>>>> >>>>>
>> >> (329) +
>     (330) +
>>>>> (335) +

>>>>> >>>>> >>>>> >>>>> >>>>>
      (360) +

>>>>> >>>>> >>>>> >>>>>
>> >> (384) +

>>>>> >>>>> >>>>> >>>>>
>>>   (407) +
>     (408) +
.

*/