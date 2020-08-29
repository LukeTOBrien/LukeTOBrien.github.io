require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CodePenComponent_1 = require("./src/CodePenComponent");
window.customElements.define('codepen-component', CodePenComponent_1.CodePenComponent);
},{"./src/CodePenComponent":2}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CodePenComponentProperties_1 = require("./Models/CodePenComponentProperties");
const CodePenProcessor_1 = require("./Processors/CodePenProcessor");
class CodePenComponent extends HTMLElement {
    constructor() {
        super();
        this.properties = new CodePenComponentProperties_1.CodePenComponentProperties();
        this.properties.pen = this.pen;
        this.properties.user = this.user;
        this.properties.shadow = this.shadow;
        console.log(this);
        console.log(this.getAttribute('user'));
    }
    get pen() {
        return this.getAttribute('pen');
    }
    set pen(val) {
        if (val) {
            this.setAttribute('pen', val);
        }
        else {
            this.removeAttribute('pen');
        }
    }
    get user() {
        return this.getAttribute('user');
    }
    set user(val) {
        if (val) {
            this.setAttribute('user', val);
        }
        else {
            this.removeAttribute('user');
        }
    }
    get shadow() {
        return this.getAttribute('shadow') == "true";
    }
    set shadow(val) {
        if (val) {
            this.setAttribute('shadow', val.toString());
        }
        else {
            this.removeAttribute('shadow');
        }
    }
    connectedCallback() {
        console.log(this.children);
        this.processor = new CodePenProcessor_1.CodePenProcessor(this);
        this.processor.process(this.properties);
    }
}
exports.CodePenComponent = CodePenComponent;
},{"./Models/CodePenComponentProperties":3,"./Processors/CodePenProcessor":4}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CodePenComponentProperties {
}
exports.CodePenComponentProperties = CodePenComponentProperties;
},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const HtmlProcessor_1 = require("./HtmlProcessor");
const ShadowDomRenderer_1 = require("../Renderers/ShadowDomRenderer");
const SlotProcessor_1 = require("./SlotProcessor");
const DomRenderer_1 = require("../Renderers/DomRenderer");
const codePenUrl = "https://codepen.io";
class CodePenProcessor {
    constructor(element) {
        this.element = element;
        this.htmlProcessor = new HtmlProcessor_1.HtmlProcessor(element);
        this.slotProcessor = new SlotProcessor_1.SlotProcessor();
    }
    process(properties) {
        if (!properties.user) {
            let ele = $(this.element);
            properties.user = ele.attr('user');
            properties.pen = ele.attr('pen');
            properties.shadow = ele.attr('shadow') == 'true';
            console.log('Shadow is ' + properties.shadow);
        }
        if (properties.shadow === false) {
            this.renderer = new DomRenderer_1.DomRenderer(this.element);
        }
        else {
            this.renderer = new ShadowDomRenderer_1.ShadowDomRenderer(this.element);
        }
        this.fetchCodePen(properties)
            .then(info => {
            try {
                info.html = this.htmlProcessor.process(info.html);
                let template = $(info.html);
                let $element = $(this.element);
                this.slotProcessor.process(template, $element);
                info.html = template[0].outerHTML;
            }
            catch (ex) {
            }
            setTimeout(function () {
                let script = document.createElement('script');
                script.textContent = info.js;
                document.body.appendChild(script);
            }, 800);
            this.renderer.render(info);
        });
    }
    fetchCodePen(properties) {
        return Promise.all([
            this.fetch(properties, '.html'),
            this.fetch(properties, '.css'),
            this.fetch(properties, '.js')
        ]).then(results => {
            return {
                html: results[0],
                css: results[1],
                js: results[2],
                licence: "Bob the Builder"
            };
        });
    }
    fetch(properties, ext) {
        return fetch(`${codePenUrl}/${properties.user}/pen/${properties.pen}${ext}`)
            .then(response => {
            return response.text();
        });
    }
}
exports.CodePenProcessor = CodePenProcessor;
},{"../Renderers/DomRenderer":7,"../Renderers/ShadowDomRenderer":8,"./HtmlProcessor":5,"./SlotProcessor":6}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AllTemplateRules_1 = require("../TemplateRules/AllTemplateRules");
class HtmlProcessor {
    constructor(element) {
        this.element = element;
    }
    process(html) {
        let $element = $(this.element);
        let $html = $(html);
        for (let rule of AllTemplateRules_1.allTemplateRules) {
            if ($html.find(rule.selector).length > 0) {
                $html = $(rule.process($html, $element));
            }
        }
        return $html[0].outerHTML;
    }
}
exports.HtmlProcessor = HtmlProcessor;
},{"../TemplateRules/AllTemplateRules":9}],6:[function(require,module,exports){
(function (global){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SlotProcessor {
    constructor(jquery) {
        this.slots = [];
        if (jquery) {
            global['$'] = jquery;
        }
    }
    process($template, $element) {
        let slotDepth = [];
        $element.children('[slot]').each((index, slot) => {
            this.flattenSlots($(slot), index, "", index, slotDepth, $element);
        });
        if (slotDepth.length == 0) {
            return;
        }
        for (let slot of this.slots) {
            $element.append(slot);
        }
        let slotsToAppend = [];
        let slotsInTemplate = $template.find('slot');
        console.log('Num slots in template = ' + (slotsInTemplate.length) + ' ; slot depth = ' + (slotDepth.length));
        console.log('For loopy = ' + (slotsInTemplate.length - 1) + ' => ' + (slotDepth.length));
        if (slotsInTemplate.length < slotDepth.length) {
            for (let i = slotsInTemplate.length - 1; i < slotDepth.length; i++) {
                let base = $template.find('.cpc-base').first()
                    .clone();
                slotsToAppend.push(base);
            }
        }
        for (let slot of slotsToAppend) {
            $template.find('.cpc-root').append(slot);
        }
        let i = 0;
        $template.find('slot').each((index, slot) => {
            this.renameSlot($(slot), slotDepth[0], $element);
            i++;
        });
    }
    flattenSlots(slot, slotIndex, slotName, index, slotDepth, element) {
        let name = slot.attr('slot');
        if (slot.attr('slot') == slotName) {
            if (!slotDepth[slotIndex + 1]) {
                slotDepth[slotIndex + 1] = [];
            }
            slotDepth[slotIndex + 1] = [].concat(slotDepth[slotIndex]);
            slotDepth[slotIndex + 1].push(slotIndex + 1);
            slot.attr('slot', slotName + slotDepth[slotIndex + 1].join('-'));
        }
        else {
            if (!slotDepth[slotIndex]) {
                slotDepth[slotIndex] = [];
            }
            slotDepth[slotIndex].push(slotIndex + 1);
            slot.attr('slot', slot.attr('slot') + slotDepth[slotIndex].join('-'));
        }
        slot.children('[slot]').each((index, child) => {
            let $child = $(child);
            this.flattenSlots($child, slotIndex, name, index, slotDepth, element);
        });
        slot.remove();
        this.slots.push(slot);
    }
    renameSlot(slot, slotDepth, element) {
        if (slot.hasClass('cpc-same')) {
            this.sameIndex++;
            let baseSlotName = slot.parentsUntil('.cpc-base').first()
                .children('slot').attr('name') + slotDepth.join('-');
            let copyEle = element.find(`[slot=${baseSlotName}]`)
                .clone();
            copyEle.attr('slot', baseSlotName + this.sameIndex);
            slot.attr('name', baseSlotName + this.sameIndex);
            element.append(copyEle);
        }
        else {
            this.sameIndex = 0;
            slot.attr('name', slot.attr('name') + slotDepth.join('-'));
        }
    }
}
exports.SlotProcessor = SlotProcessor;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DomRenderer {
    constructor(element) {
        this.element = element;
    }
    render(info) {
        try {
            let template = $(info.html);
            let asset = template.find('a-assets');
            let sky = template.find('a-sky');
            let light = template.find('a-light');
            asset.remove();
            sky.remove();
            light.remove();
            $('a-assets').append(asset.children());
            $(this.element).replaceWith(template);
        }
        catch (ex) { }
        $(this.element).append(info.html);
    }
}
exports.DomRenderer = DomRenderer;
},{}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ShadowDomRenderer {
    constructor(element) {
        this.element = element;
    }
    render(info) {
        let tmpl = document.createElement('template');
        tmpl.innerHTML = `
    <script>
    /*
       ${info.licence}
    */
   </script>
    <style>
    ${info.css}
    </style>
    ${info.html}
    `;
        let shadowRoot = this.element.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(tmpl.content.cloneNode(true));
    }
}
exports.ShadowDomRenderer = ShadowDomRenderer;
},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IgnoreTemplateRule_1 = require("./IgnoreTemplateRule");
exports.allTemplateRules = [
    new IgnoreTemplateRule_1.IgnoreTemplateRule()
];
},{"./IgnoreTemplateRule":10}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class IgnoreTemplateRule {
    constructor() {
        this.selector = '.ignore';
    }
    process($template, $element) {
        $template.find(this.selector).remove();
        return $template;
    }
}
exports.IgnoreTemplateRule = IgnoreTemplateRule;
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC50cyIsInNyYy9Db2RlUGVuQ29tcG9uZW50LnRzIiwic3JjL01vZGVscy9Db2RlUGVuQ29tcG9uZW50UHJvcGVydGllcy50cyIsInNyYy9Qcm9jZXNzb3JzL0NvZGVQZW5Qcm9jZXNzb3IudHMiLCJzcmMvUHJvY2Vzc29ycy9IdG1sUHJvY2Vzc29yLnRzIiwic3JjL1Byb2Nlc3NvcnMvU2xvdFByb2Nlc3Nvci50cyIsInNyYy9SZW5kZXJlcnMvRG9tUmVuZGVyZXIudHMiLCJzcmMvUmVuZGVyZXJzL1NoYWRvd0RvbVJlbmRlcmVyLnRzIiwic3JjL1RlbXBsYXRlUnVsZXMvQWxsVGVtcGxhdGVSdWxlcy50cyIsInNyYy9UZW1wbGF0ZVJ1bGVzL0lnbm9yZVRlbXBsYXRlUnVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsNkRBQXlEO0FBRXpELE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLG1DQUFnQixDQUFDLENBQUM7Ozs7QUNGcEUsb0ZBQWlGO0FBQ2pGLG9FQUFnRTtBQUVoRSxNQUFhLGdCQUFpQixTQUFRLFdBQVc7SUEwQzdDO1FBQ0ksS0FBSyxFQUFFLENBQUM7UUF4Q1osZUFBVSxHQUErQixJQUFJLHVEQUEwQixFQUFFLENBQUM7UUEwQ3RFLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDL0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUNqQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBRTdDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFD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LENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxFQUFFO2dCQUMzQixTQUFTLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQzthQUNqQztZQUNELFNBQVMsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUMzRCxTQUFTLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDN0MsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsUUFBUSxHQUFHLFNBQVMsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDcEU7YUFBTTtZQUNILElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQ3ZCLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUM7YUFDN0I7WUFDRCxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN6QyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUN6RTtRQUdELElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQzFDLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUV0QixJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDMUUsQ0FBQyxDQUFDLENBQUM7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QUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsRUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFDLENBQUMsQ0FBQztRQUMzRCxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDckQsQ0FBQztDQUVKO0FBekJELDhDQXlCQzs7OztBQzFCRCw2REFBMEQ7QUFFN0MsUUFBQSxnQkFBZ0IsR0FBRztJQUM1QixJQUFJLHVDQUFrQixFQUFFO0NBRzNCLENBQUM7Ozs7QUNORixNQUFhLGtCQUFrQjtJQUEvQjtRQUVJLGFBQVEsR0FBRyxTQUFTLENBQUM7SUFTekIsQ0FBQztJQVBHLE9BQU8sQ0FBQyxTQUE4QixFQUFFLFFBQTZCO1FBRWpFLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBRXZDLE9BQU8sU0FBUyxDQUFDO0lBQ3JCLENBQUM7Q0FFSjtBQVhELGdEQVdDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IHsgQ29kZVBlbkNvbXBvbmVudCB9IGZyb20gJy4vc3JjL0NvZGVQZW5Db21wb25lbnQnXHJcblxyXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCdjb2RlcGVuLWNvbXBvbmVudCcsIENvZGVQZW5Db21wb25lbnQpO1xyXG4vLyB3aW5kb3cuY3VzdG9tRWxlbWVudHMud2hlbkRlZmluZWQuLi4uIExvYWQgYWxsIHNjcmlwdCBmb3IgZWFjaCIsImltcG9ydCB7IENvZGVQZW5Db21wb25lbnRQcm9wZXJ0aWVzIH0gZnJvbSBcIi4vTW9kZWxzL0NvZGVQZW5Db21wb25lbnRQcm9wZXJ0aWVzXCI7XHJcbmltcG9ydCB7IENvZGVQZW5Qcm9jZXNzb3IgfSBmcm9tICcuL1Byb2Nlc3NvcnMvQ29kZVBlblByb2Nlc3NvcidcclxuXHJcbmV4cG9ydCBjbGFzcyBDb2RlUGVuQ29tcG9uZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xyXG5cclxuICAgIHByb2Nlc3NvcjogQ29kZVBlblByb2Nlc3NvcjtcclxuICAgIHByb3BlcnRpZXM6IENvZGVQZW5Db21wb25lbnRQcm9wZXJ0aWVzID0gbmV3IENvZGVQZW5Db21wb25lbnRQcm9wZXJ0aWVzKCk7XHJcblxyXG4gICAgLy8jcmVnaW9uIFByb3BlcnRpZXNcclxuXHJcbiAgICBnZXQgcGVuKCk6IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QXR0cmlidXRlKCdwZW4nKTtcclxuICAgIH1cclxuICAgIHNldCBwZW4odmFsOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAodmFsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKCdwZW4nLCB2YWwpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKCdwZW4nKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHVzZXIoKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRBdHRyaWJ1dGUoJ3VzZXInKTtcclxuICAgIH1cclxuICAgIHNldCB1c2VyKHZhbDogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKHZhbCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZSgndXNlcicsIHZhbCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoJ3VzZXInKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHNoYWRvdygpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRBdHRyaWJ1dGUoJ3NoYWRvdycpID09IFwidHJ1ZVwiO1xyXG4gICAgfVxyXG4gICAgc2V0IHNoYWRvdyh2YWw6IGJvb2xlYW4pIHtcclxuICAgICAgICBpZiAodmFsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKCdzaGFkb3cnLCB2YWwudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoJ3NoYWRvdycpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyNlbmRyZWdpb24gUHJvcGVydGllc1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcblxyXG4gICAgICAgIHRoaXMucHJvcGVydGllcy5wZW4gPSB0aGlzLnBlbjtcclxuICAgICAgICB0aGlzLnByb3BlcnRpZXMudXNlciA9IHRoaXMudXNlcjtcclxuICAgICAgICB0aGlzLnByb3BlcnRpZXMuc2hhZG93ID0gdGhpcy5zaGFkb3c7XHJcblxyXG5jb25zb2xlLmxvZyh0aGlzKTtcclxuY29uc29sZS5sb2codGhpcy5nZXRBdHRyaWJ1dGUoJ3VzZXInKSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuY2hpbGRyZW4pO1xyXG4gICAgICAgIHRoaXMucHJvY2Vzc29yID0gbmV3IENvZGVQZW5Qcm9jZXNzb3IodGhpcyk7XHJcbiAgICAgICAgdGhpcy5wcm9jZXNzb3IucHJvY2Vzcyh0aGlzLnByb3BlcnRpZXMpO1xyXG5cclxuICAgIH1cclxufSIsImV4cG9ydCBjbGFzcyBDb2RlUGVuQ29tcG9uZW50UHJvcGVydGllcyB7XHJcbiAgICBwZW46IHN0cmluZ1xyXG4gICAgdXNlcjogc3RyaW5nXHJcbiAgICBzaGFkb3c6IGJvb2xlYW5cclxuICAgIGdsb2JhbDogYm9vbGVhblxyXG4gICAgZGF0YVNldDogYW55XHJcbn0iLCJpbXBvcnQgeyBDb2RlUGVuQ29tcG9uZW50SW5mbyB9IGZyb20gJy4uL01vZGVscy9Db2RlUGVuQ29tcG9uZW50SW5mbyc7XHJcbmltcG9ydCB7IENvZGVQZW5Db21wb25lbnRQcm9wZXJ0aWVzIH0gZnJvbSAnLi4vTW9kZWxzL0NvZGVQZW5Db21wb25lbnRQcm9wZXJ0aWVzJztcclxuaW1wb3J0IHsgSHRtbFByb2Nlc3NvciB9IGZyb20gJy4vSHRtbFByb2Nlc3NvcidcclxuaW1wb3J0IHsgSVJlbmRlcmVyIH0gZnJvbSAnLi4vUmVuZGVyZXJzL0lSZW5kZXJlcic7XHJcbmltcG9ydCB7IFNoYWRvd0RvbVJlbmRlcmVyIH0gZnJvbSAnLi4vUmVuZGVyZXJzL1NoYWRvd0RvbVJlbmRlcmVyJztcclxuaW1wb3J0IHsgU2xvdFByb2Nlc3NvciB9IGZyb20gJy4vU2xvdFByb2Nlc3Nvcic7XHJcbmltcG9ydCB7IERvbVJlbmRlcmVyIH0gZnJvbSAnLi4vUmVuZGVyZXJzL0RvbVJlbmRlcmVyJztcclxuZGVjbGFyZSB2YXIgJDogSlF1ZXJ5U3RhdGljO1xyXG5cclxuY29uc3QgY29kZVBlblVybCA9IFwiaHR0cHM6Ly9jb2RlcGVuLmlvXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBDb2RlUGVuUHJvY2Vzc29yIHtcclxuXHJcbiAgICBwcml2YXRlIGh0bWxQcm9jZXNzb3I6IEh0bWxQcm9jZXNzb3JcclxuICAgIHByaXZhdGUgc2xvdFByb2Nlc3NvcjogU2xvdFByb2Nlc3NvclxyXG4gICAgcHJpdmF0ZSByZW5kZXJlcjogSVJlbmRlcmVyXHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBlbGVtZW50OiBIVE1MRWxlbWVudCkge1xyXG4gICAgICAgIHRoaXMuaHRtbFByb2Nlc3NvciA9IG5ldyBIdG1sUHJvY2Vzc29yKGVsZW1lbnQpO1xyXG4gICAgICAgIHRoaXMuc2xvdFByb2Nlc3NvciA9IG5ldyBTbG90UHJvY2Vzc29yKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzcyhwcm9wZXJ0aWVzOiBDb2RlUGVuQ29tcG9uZW50UHJvcGVydGllcykge1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBXaGVuIHRlc3Rpbmcgd2l0aCBBLUZyYW1lIHRoZSBwcm9wZXJ0aWVzIHdlcmUgbm90IHNldFxyXG4gICAgICAgIC8vIHRoaXMuZ2V0QXR0cmlidXRlKC4uLikgc2VlbWVkIHRvIHJldHVybiBudWxsbCA/P1xyXG4gICAgICAgIGlmICghcHJvcGVydGllcy51c2VyKSB7XHJcbiAgICAgICAgICAgIGxldCBlbGUgPSAkKHRoaXMuZWxlbWVudCk7XHJcbiAgICAgICAgICAgIHByb3BlcnRpZXMudXNlciA9IGVsZS5hdHRyKCd1c2VyJyk7XHJcbiAgICAgICAgICAgIHByb3BlcnRpZXMucGVuID0gZWxlLmF0dHIoJ3BlbicpO1xyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzLnNoYWRvdyA9IGVsZS5hdHRyKCdzaGFkb3cnKSA9PSAndHJ1ZSc7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdTaGFkb3cgaXMgJyArIHByb3BlcnRpZXMuc2hhZG93KTtcclxuICAgICAgICB9ICAgIFxyXG4gICAgICAgIFxyXG5cclxuXHJcbiAgICAgICAgaWYgKHByb3BlcnRpZXMuc2hhZG93ID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVyID0gbmV3IERvbVJlbmRlcmVyKHRoaXMuZWxlbWVudCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJlciA9IG5ldyBTaGFkb3dEb21SZW5kZXJlcih0aGlzLmVsZW1lbnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5mZXRjaENvZGVQZW4ocHJvcGVydGllcylcclxuXHJcbiAgICAgICAgICAgIC50aGVuKGluZm8gPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5mby5odG1sID0gdGhpcy5odG1sUHJvY2Vzc29yLnByb2Nlc3MoaW5mby5odG1sKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRlbXBsYXRlID0gJChpbmZvLmh0bWwpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCAkZWxlbWVudCA9ICQodGhpcy5lbGVtZW50KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zbG90UHJvY2Vzc29yLnByb2Nlc3ModGVtcGxhdGUsICRlbGVtZW50KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaW5mby5odG1sID0gdGVtcGxhdGVbMF0ub3V0ZXJIVE1MO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogRm9yIG5vdyB3ZSB3aWxsIGFkZCB0aGlzIG9uIGEgdGltZW91dFxyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpXHJcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0LnRleHRDb250ZW50ID0gaW5mby5qcztcclxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNjcmlwdClcclxuICAgICAgICAgICAgICAgIH0sIDgwMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5yZW5kZXIoaW5mbyk7XHJcblxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgLy8gVE9ETyBGZXRjaCBmcm9tIGxvY2FsIGFscmVhZHkgZG93bmxvYWRlZCBieSBjb2RlcGVuLWNvbXBvbmVudC1sb2FkZXJcclxuICAgIC8vIFJlYWQgZnJvbSBTZXJhaWxpc2VkIENvZGVQZW5Db21wb25lbnRJbmZvIGpzb24gZmlsZVxyXG5cclxuICAgIGZldGNoQ29kZVBlbihwcm9wZXJ0aWVzOiBDb2RlUGVuQ29tcG9uZW50UHJvcGVydGllcyk6IFByb21pc2U8Q29kZVBlbkNvbXBvbmVudEluZm8+IHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xyXG4gICAgICAgICAgICB0aGlzLmZldGNoKHByb3BlcnRpZXMsICcuaHRtbCcpLFxyXG4gICAgICAgICAgICAvLy50aGVuKGh0bWwgPT4gdGhpcy5odG1sUHJvY2Vzc29yLnByb2Nlc3MoaHRtbC5yZXBsYWNlKC9cXFxcL2csICcnKSkpLFxyXG4gICAgICAgICAgICB0aGlzLmZldGNoKHByb3BlcnRpZXMsICcuY3NzJyksXHJcbiAgICAgICAgICAgIHRoaXMuZmV0Y2gocHJvcGVydGllcywgJy5qcycpLy8sXHJcbiAgICAgICAgICAgIC8vdGhpcy5mZXRjaChwcm9wZXJ0aWVzLCAnL2xpY2Vuc2UnKVxyXG4gICAgICAgIF0pLnRoZW4ocmVzdWx0cyA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBodG1sOiByZXN1bHRzWzBdLFxyXG4gICAgICAgICAgICAgICAgY3NzOiByZXN1bHRzWzFdLFxyXG4gICAgICAgICAgICAgICAganM6IHJlc3VsdHNbMl0sXHJcbiAgICAgICAgICAgICAgICBsaWNlbmNlOiBcIkJvYiB0aGUgQnVpbGRlclwiLy8gcmVzdWx0c1szXVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZldGNoKHByb3BlcnRpZXM6IENvZGVQZW5Db21wb25lbnRQcm9wZXJ0aWVzLCBleHQ6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBmZXRjaChgJHtjb2RlUGVuVXJsfS8ke3Byb3BlcnRpZXMudXNlcn0vcGVuLyR7cHJvcGVydGllcy5wZW59JHtleHR9YClcclxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLnRleHQoKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbn0iLCJkZWNsYXJlIHZhciAkOiBKUXVlcnlTdGF0aWM7XHJcbmltcG9ydCB7IGFsbFRlbXBsYXRlUnVsZXMgfSBmcm9tICcuLi9UZW1wbGF0ZVJ1bGVzL0FsbFRlbXBsYXRlUnVsZXMnXHJcblxyXG5leHBvcnQgY2xhc3MgSHRtbFByb2Nlc3NvciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBlbGVtZW50OiBIVE1MRWxlbWVudCkge1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzKGh0bWw6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0ICRlbGVtZW50ID0gJCh0aGlzLmVsZW1lbnQpXHJcbiAgICAgICAgbGV0ICRodG1sID0gJChodG1sKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgcnVsZSBvZiBhbGxUZW1wbGF0ZVJ1bGVzKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoJGh0bWwuZmluZChydWxlLnNlbGVjdG9yKS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAkaHRtbCA9ICQocnVsZS5wcm9jZXNzKCRodG1sLCAkZWxlbWVudCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuICRodG1sWzBdLm91dGVySFRNTDtcclxuXHJcbiAgICB9XHJcblxyXG59IiwiZGVjbGFyZSB2YXIgZ2xvYmFsOiBhbnk7XHJcbmRlY2xhcmUgdmFyICQ6IEpRdWVyeVN0YXRpYztcclxuXHJcbmV4cG9ydCBjbGFzcyBTbG90UHJvY2Vzc29yIHtcclxuXHJcbiAgICBzbG90czogYW55W10gPSBbXTtcclxuICAgIGluZGV4OiBudW1iZXI7XHJcbiAgICBzYW1lSW5kZXg6IG51bWJlcjtcclxuXHJcbiAgICBcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihqcXVlcnk/OiBKUXVlcnlTdGF0aWMpIHtcclxuICAgICAgICBpZiAoanF1ZXJ5KSB7XHJcbiAgICAgICAgICAgIGdsb2JhbFsnJCddID0ganF1ZXJ5O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzKCR0ZW1wbGF0ZTogSlF1ZXJ5PEhUTUxFbGVtZW50PiwgJGVsZW1lbnQ6IEpRdWVyeTxIVE1MRWxlbWVudD4pIHtcclxuXHJcbiAgICAgICAgbGV0IHNsb3REZXB0aCA9IFtdO1xyXG5cclxuICAgICAgICAkZWxlbWVudC5jaGlsZHJlbignW3Nsb3RdJykuZWFjaCgoaW5kZXgsIHNsb3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5mbGF0dGVuU2xvdHMoJChzbG90KSwgaW5kZXgsIFwiXCIsIGluZGV4LCBzbG90RGVwdGgsICRlbGVtZW50KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKHNsb3REZXB0aC5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBzbG90IG9mIHRoaXMuc2xvdHMpIHtcclxuICAgICAgICAgICAgJGVsZW1lbnQuYXBwZW5kKHNsb3QpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgbGVzcyBzbG90cyBpbiB0aGUgdGVtcGxhdGUgdGhhbiBpbiB0aGUgZWxlbWVudFxyXG4gICAgICAgIC8vIEFkZCBtb3JlIHNsb3RlcyB0byB0aGUgdGVtcGxhdGVcclxuICAgICAgICBsZXQgc2xvdHNUb0FwcGVuZDogYW55W10gPSBbXTtcclxuICAgICAgICBsZXQgc2xvdHNJblRlbXBsYXRlID0gJHRlbXBsYXRlLmZpbmQoJ3Nsb3QnKTtcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coJ051bSBzbG90cyBpbiB0ZW1wbGF0ZSA9ICcgKyAoc2xvdHNJblRlbXBsYXRlLmxlbmd0aCkgKyAnIDsgc2xvdCBkZXB0aCA9ICcgKyAoc2xvdERlcHRoLmxlbmd0aCkpXHJcbiAgICAgICAgY29uc29sZS5sb2coJ0ZvciBsb29weSA9ICcgKyAoc2xvdHNJblRlbXBsYXRlLmxlbmd0aCAtIDEpICsgJyA9PiAnICsgKHNsb3REZXB0aC5sZW5ndGgpKVxyXG4gICAgICAgIGlmIChzbG90c0luVGVtcGxhdGUubGVuZ3RoIDwgc2xvdERlcHRoLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gc2xvdHNJblRlbXBsYXRlLmxlbmd0aCAtIDE7IGkgPCBzbG90RGVwdGgubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGxldCBiYXNlID0gJHRlbXBsYXRlLmZpbmQoJy5jcGMtYmFzZScpLmZpcnN0KClcclxuICAgICAgICAgICAgICAgIC5jbG9uZSgpO1xyXG4gICAgICAgICAgICAgICAgc2xvdHNUb0FwcGVuZC5wdXNoKFxyXG4gICAgICAgICAgICAgICAgICAgIGJhc2VcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChsZXQgc2xvdCBvZiBzbG90c1RvQXBwZW5kKSB7XHJcbiAgICAgICAgICAgJHRlbXBsYXRlLmZpbmQoJy5jcGMtcm9vdCcpLmFwcGVuZChzbG90KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBpID0gMDtcclxuICAgICAgICAvLyBUT0RPOiBHbyByb3VuZCBlYWNoIHNsb3REZXB0aCBiZWNhdXNlIHdlIG5lZWQgdG8gY3JlYXRlIHNsb3RzIGlmIHRoZSBkb24ndCBleGlzdFxyXG4gICAgICAgICR0ZW1wbGF0ZS5maW5kKCdzbG90JykuZWFjaCgoaW5kZXgsIHNsb3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5yZW5hbWVTbG90KCQoc2xvdCksIHNsb3REZXB0aFswXSwgJGVsZW1lbnQpO1xyXG4gICAgICAgICAgICBpKys7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICB9XHJcblxyXG4gICAgZmxhdHRlblNsb3RzKHNsb3Q6IEpRdWVyeTxIVE1MRWxlbWVudD4sIHNsb3RJbmRleDogbnVtYmVyLCBzbG90TmFtZTogc3RyaW5nLCBpbmRleDogbnVtYmVyLCBzbG90RGVwdGg6IGFueSwgZWxlbWVudDogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG5cclxuICAgICAgICBsZXQgbmFtZSA9IHNsb3QuYXR0cignc2xvdCcpO1xyXG5cclxuICAgICAgICBpZiAoc2xvdC5hdHRyKCdzbG90JykgPT0gc2xvdE5hbWUpIHtcclxuICAgICAgICAgICAgaWYgKCFzbG90RGVwdGhbc2xvdEluZGV4ICsgMV0pIHtcclxuICAgICAgICAgICAgICAgIHNsb3REZXB0aFtzbG90SW5kZXggKyAxXSA9IFtdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNsb3REZXB0aFtzbG90SW5kZXggKyAxXSA9IFtdLmNvbmNhdChzbG90RGVwdGhbc2xvdEluZGV4XSk7XHJcbiAgICAgICAgICAgIHNsb3REZXB0aFtzbG90SW5kZXggKyAxXS5wdXNoKHNsb3RJbmRleCArIDEpO1xyXG4gICAgICAgICAgICBzbG90LmF0dHIoJ3Nsb3QnLCBzbG90TmFtZSArIHNsb3REZXB0aFtzbG90SW5kZXggKyAxXS5qb2luKCctJykpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICghc2xvdERlcHRoW3Nsb3RJbmRleF0pIHtcclxuICAgICAgICAgICAgICAgIHNsb3REZXB0aFtzbG90SW5kZXhdID0gW107XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2xvdERlcHRoW3Nsb3RJbmRleF0ucHVzaChzbG90SW5kZXggKyAxKTtcclxuICAgICAgICAgICAgc2xvdC5hdHRyKCdzbG90Jywgc2xvdC5hdHRyKCdzbG90JykgKyBzbG90RGVwdGhbc2xvdEluZGV4XS5qb2luKCctJykpO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIHNsb3QuY2hpbGRyZW4oJ1tzbG90XScpLmVhY2goKGluZGV4LCBjaGlsZCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgJGNoaWxkID0gJChjaGlsZCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmZsYXR0ZW5TbG90cygkY2hpbGQsIHNsb3RJbmRleCwgbmFtZSwgaW5kZXgsIHNsb3REZXB0aCwgZWxlbWVudCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHNsb3QucmVtb3ZlKCk7XHJcbiAgICAgICAgdGhpcy5zbG90cy5wdXNoKHNsb3QpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmFtZVNsb3Qoc2xvdDogSlF1ZXJ5PEhUTUxFbGVtZW50Piwgc2xvdERlcHRoOiBudW1iZXJbXSwgZWxlbWVudDogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG4gICAgICAgIGlmIChzbG90Lmhhc0NsYXNzKCdjcGMtc2FtZScpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2FtZUluZGV4Kys7XHJcbiAgICAgICAgICAgIGxldCBiYXNlU2xvdE5hbWUgPSBzbG90LnBhcmVudHNVbnRpbCgnLmNwYy1iYXNlJykuZmlyc3QoKVxyXG4gICAgICAgICAgICAuY2hpbGRyZW4oJ3Nsb3QnKS5hdHRyKCduYW1lJykgKyBzbG90RGVwdGguam9pbignLScpO1xyXG4gICAgICAgICAgICAvLyBGaW5kIHRoZSBpdGVtIG9mIHRoZSBlbGVtZW50XHJcbiAgICAgICAgICAgIGxldCBjb3B5RWxlID0gZWxlbWVudC5maW5kKGBbc2xvdD0ke2Jhc2VTbG90TmFtZX1dYClcclxuICAgICAgICAgICAgICAgIC5jbG9uZSgpO1xyXG4gICAgICAgICAgICAvLyBDb3B5IHRoZSBlbGVtZW50XHJcbiAgICAgICAgICAgIC8vIEdpdmUgaXQgYSB1bmlxdWUgbmFtZVxyXG4gICAgICAgICAgICBjb3B5RWxlLmF0dHIoJ3Nsb3QnLCBiYXNlU2xvdE5hbWUgKyB0aGlzLnNhbWVJbmRleCk7XHJcbiAgICAgICAgICAgIC8vIFNldCB0aGUgc2xvdCB0byB0aGUgc2FtZSBuYW1lXHJcbiAgICAgICAgICAgIHNsb3QuYXR0cignbmFtZScsIGJhc2VTbG90TmFtZSArIHRoaXMuc2FtZUluZGV4KVxyXG4gICAgICAgICAgICBlbGVtZW50LmFwcGVuZChjb3B5RWxlKTtcclxuXHJcbiAgICAgICAgICAgIC8vc2xvdC5hdHRyKCduYW1lJywgYmFzZVNsb3ROYW1lKTtcclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnPj4gSXMgc2FtZSAtIEJhc2Ugc2xvdCBuYW1lID0gJyArIGJhc2VTbG90TmFtZSlcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnNhbWVJbmRleCA9IDA7XHJcbiAgICAgICAgICAgIHNsb3QuYXR0cignbmFtZScsIHNsb3QuYXR0cignbmFtZScpICsgc2xvdERlcHRoLmpvaW4oJy0nKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgSVJlbmRlcmVyIH0gZnJvbSBcIi4vSVJlbmRlcmVyXCI7XHJcbmltcG9ydCB7IENvZGVQZW5Db21wb25lbnRJbmZvIH0gZnJvbSBcIi4uL01vZGVscy9Db2RlUGVuQ29tcG9uZW50SW5mb1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIERvbVJlbmRlcmVyIGltcGxlbWVudHMgSVJlbmRlcmVyIHtcclxuICBcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKGluZm86IENvZGVQZW5Db21wb25lbnRJbmZvKSB7XHJcblxyXG4gICAgICAgIC8vIFRPRE86IE1vdmUgdG8gQWZyYW1lUmVuZGVyUnVsZVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGxldCB0ZW1wbGF0ZSA9ICQoaW5mby5odG1sKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBhc3NldCA9IHRlbXBsYXRlLmZpbmQoJ2EtYXNzZXRzJyk7XHJcbiAgICAgICAgICAgIGxldCBza3kgPSB0ZW1wbGF0ZS5maW5kKCdhLXNreScpO1xyXG4gICAgICAgICAgICBsZXQgbGlnaHQgPSB0ZW1wbGF0ZS5maW5kKCdhLWxpZ2h0Jyk7XHJcblxyXG4gICAgICAgICAgICBhc3NldC5yZW1vdmUoKTtcclxuICAgICAgICAgICAgc2t5LnJlbW92ZSgpO1xyXG4gICAgICAgICAgICBsaWdodC5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgICQoJ2EtYXNzZXRzJykuYXBwZW5kKFxyXG4gICAgICAgICAgICAgICAgYXNzZXQuY2hpbGRyZW4oKVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgLypcclxuICAgICAgICAgICAgJCgnYS1zY2VuZScpXHJcbiAgICAgICAgICAgICAgICAucHJlcGVuZChhc3NldClcclxuICAgICAgICAgICAgICAgIC5wcmVwZW5kKHNreSlcclxuICAgICAgICAgICAgICAgIC5hcHBlbmQobGlnaHQpO1xyXG4qL1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIHRlbXBsYXRlIGlmIGFuIEEtRnJhbWUgdGhlbiB3ZSB3YW50IHRvIHJlcGxhY2UgdGhlICBlbGVtZW50XHJcbiAgICAgICAgICAgIC8vIFRPRE86IERvbid0IGRvIHRoaXMgYW5kIGluc3RlYWQgY3JlYXQgYSBzcGVyc2lmaWMgQ29kZVBlbiBDb21wb25lbnQgZm9yIEEtRnJhbWVcclxuICAgICAgICAgICAgJCh0aGlzLmVsZW1lbnQpLnJlcGxhY2VXaXRoKHRlbXBsYXRlKTtcclxuXHJcbiAgICAgICAgICAgIC8vaW5mby5odG1sID0gdGVtcGxhdGVbMF0uaW5uZXJIVE1MO1xyXG5cclxuICAgICAgICB9IGNhdGNoKGV4KSB7fVxyXG5cclxuICAgICAgICAkKHRoaXMuZWxlbWVudCkuYXBwZW5kKGluZm8uaHRtbCk7XHJcbiAgICAgICAgLy8gVE9ETzogQWRkIHNjcmlwdCBhbmQgc3R5bGVzXHJcbiAgICB9XHJcblxyXG59IiwiaW1wb3J0IHsgQ29kZVBlbkNvbXBvbmVudEluZm8gfSBmcm9tICcuLi9Nb2RlbHMvQ29kZVBlbkNvbXBvbmVudEluZm8nXHJcbmltcG9ydCB7IElSZW5kZXJlciB9IGZyb20gJy4vSVJlbmRlcmVyJztcclxuXHJcbmV4cG9ydCBjbGFzcyBTaGFkb3dEb21SZW5kZXJlciBpbXBsZW1lbnRzIElSZW5kZXJlciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBlbGVtZW50OiBIVE1MRWxlbWVudCkge1xyXG5cclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIoaW5mbzogQ29kZVBlbkNvbXBvbmVudEluZm8pIHtcclxuXHJcbiAgICBsZXQgdG1wbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XHJcbiAgICB0bXBsLmlubmVySFRNTCA9IGBcclxuICAgIDxzY3JpcHQ+XHJcbiAgICAvKlxyXG4gICAgICAgJHtpbmZvLmxpY2VuY2V9XHJcbiAgICAqL1xyXG4gICA8L3NjcmlwdD5cclxuICAgIDxzdHlsZT5cclxuICAgICR7aW5mby5jc3N9XHJcbiAgICA8L3N0eWxlPlxyXG4gICAgJHtpbmZvLmh0bWx9XHJcbiAgICBgO1xyXG5cclxuICAgIGxldCBzaGFkb3dSb290ID0gdGhpcy5lbGVtZW50LmF0dGFjaFNoYWRvdyh7bW9kZTogJ29wZW4nfSk7XHJcbiAgICBzaGFkb3dSb290LmFwcGVuZENoaWxkKHRtcGwuY29udGVudC5jbG9uZU5vZGUodHJ1ZSkpO1xyXG4gICAgfVxyXG5cclxufSIsImltcG9ydCB7IFJlcGVhdGVyVGVtcGxhdGVSdWxlIH0gZnJvbSAnLi9SZXBlYXRlclRlbXBsYXRlUnVsZSdcclxuaW1wb3J0IHsgQ29udGVudFJlcGxhY2VUZW1wbGF0ZVJ1bGUgfSBmcm9tICcuL0NvbnRlbnRSZXBsYWNlVGVtcGxhdGVSdWxlJ1xyXG5pbXBvcnQgeyBJZ25vcmVUZW1wbGF0ZVJ1bGUgfSBmcm9tICcuL0lnbm9yZVRlbXBsYXRlUnVsZSc7XHJcblxyXG5leHBvcnQgY29uc3QgYWxsVGVtcGxhdGVSdWxlcyA9IFtcclxuICAgIG5ldyBJZ25vcmVUZW1wbGF0ZVJ1bGUoKVxyXG4gICAgLy9uZXcgUmVwZWF0ZXJUZW1wbGF0ZVJ1bGUoKSxcclxuICAgIC8vbmV3IENvbnRlbnRSZXBsYWNlVGVtcGxhdGVSdWxlKClcclxuXTsiLCJpbXBvcnQgeyBJVGVtcGxhdGVSdWxlIH0gZnJvbSBcIi4vSVRlbXBsYXRlUnVsZVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIElnbm9yZVRlbXBsYXRlUnVsZSBpbXBsZW1lbnRzIElUZW1wbGF0ZVJ1bGUge1xyXG5cclxuICAgIHNlbGVjdG9yID0gJy5pZ25vcmUnO1xyXG5cclxuICAgIHByb2Nlc3MoJHRlbXBsYXRlOiBKUXVlcnk8SFRNTEVsZW1lbnQ+LCAkZWxlbWVudDogSlF1ZXJ5PEhUTUxFbGVtZW50Pik6IEpRdWVyeTxIVE1MRWxlbWVudD4ge1xyXG4gICAgICAgIFxyXG4gICAgICAgICR0ZW1wbGF0ZS5maW5kKHRoaXMuc2VsZWN0b3IpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICByZXR1cm4gJHRlbXBsYXRlO1xyXG4gICAgfVxyXG5cclxufSJdfQ==
