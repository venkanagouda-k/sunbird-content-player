var EmbedPlugin = Plugin.extend({
    _type: 'embed',
    _isContainer: false,
    _render: true,
    initPlugin: function(data) {
        var instance = this;
        if (data.template || data['template-name']) {
            var templateId = (data['template-name'])? data['template-name'] : this._stage.getTemplate(data.template);
            var template = this._theme._templateMap[templateId];
            if (template) {
                for (var k in data) {
                    if (k === 'template' || k === 'template-name') continue;
                    if (k.substring(0,4) == "var-") {
                        this._stage._templateVars[k.substring(4)] = data[k];
                    } else if (k.substring(0,3) == "ev-") {
                        this._stage._templateVars[k.substring(3)] = this.replaceExpressions(data[k]);
                    } else {
                        this._stage._templateVars[k] = data[k];
                    }
                }
                this._self = new createjs.Container();
                data.w = data.w || 100;
                data.h = data.h || 100;
                var dims = this.relativeDims();
                this._self.x = dims.x;
                this._self.y = dims.y;
                // var hit = new createjs.Shape();
                // hit.graphics.beginFill("#000").r(0, 0, dims.w, dims.h);
                // this._self.hitArea = hit;
                
                this.invokeChildren(template, this, this._stage, this._theme);
            }
        }
    },
    replaceExpressions: function(model) {
        var arr = [];
        var idx = 0;
        var nextIdx = model.indexOf('${', idx);
        var endIdx = model.indexOf('}', idx + 1);
        while (nextIdx != -1 && endIdx != -1) {
            var expr = model.substring(nextIdx, endIdx+1);
            arr.push(expr);
            idx = endIdx;
            nextIdx = model.indexOf('${', idx);
            endIdx = model.indexOf('}', idx + 1);
        }
        if (arr.length > 0) {
            for (var i=0; i<arr.length; i++) {
                var val = this.evaluateExpr(arr[i]);
                model = model.replace(arr[i], val);
            }
        }
        return model;
    }
});
PluginManager.registerPlugin('embed', EmbedPlugin);
