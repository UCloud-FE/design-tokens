const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
if (args.length < 1) {
    return console.error('必须传入要转变的文件夹地址');
}
const [target, output] = args;

const targetPath = path.join(process.cwd(), target);
const globalTokenDefinePath = path.join(targetPath, '../../globals');
const defaultTokenDefinePath = path.join(targetPath, '../default');

const files = fs.readdirSync(targetPath).map(f => path.join(targetPath, f));
const globalTokenDefineFiles = fs.readdirSync(globalTokenDefinePath).map(f => path.join(globalTokenDefinePath, f));
const defaultTokenDefineFiles = fs.readdirSync(defaultTokenDefinePath).map(f => path.join(defaultTokenDefinePath, f));

const tokenDefine = {
    builtin: {},
    common: {
        control: {
            _meta: {
                group: '表单交互控件通用变量（input、select 等）'
            },
            height: {
                sm: {
                    value: '24px',
                    comment: '小号控件高度'
                },
                md: {
                    value: '28px',
                    comment: '中号控件高度'
                },
                lg: {
                    value: '32px',
                    comment: '大号控件高度'
                }
            },
            spacing: {
                sm: {
                    value: '8px',
                    comment: '小号控件间距'
                },
                md: {
                    value: '8px',
                    comment: '中号控件间距'
                },
                lg: {
                    value: '12px',
                    comment: '大号控件间距'
                }
            },
            font_size: {
                sm: {
                    value: '12px',
                    comment: '小号控件字号'
                },
                md: {
                    value: '12px',
                    comment: '中号控件字号'
                },
                lg: {
                    value: '14px',
                    comment: '大号控件字号'
                }
            }
        }
    },
    component: {},
    external: {}
};

const isObject = v => {
    return {}.toString.call(v) === '[object Object]';
};

const override = (target, patch) => {
    for (const key in patch) {
        if (isObject(target[key])) {
            override(target[key], patch[key]);
        } else {
            target[key] = patch[key];
        }
    }
};

const cache = {};
const cacheColorKeys = [/^notice_\d$/, /^warning_\d$/, /^error_\d$/, /^success_\d$/, /^disabled_\d$/];

const builtinColorMap = {
    base: {
        _meta: {
            group: '基础色'
        },
        keep: ['white', 'black', 'transparent'],
        rename: {
            'system.white': {
                n: 'environment',
                c: '环境色（如根据暗/亮主题切换）'
            },
            'system.black': {
                n: 'environment_reverse',
                c: '环境色反转'
            }
        }
    },
    special: {
        _meta: {
            group: '特殊色'
        },
        rename: {
            sidebar: {
                n: 'special_1',
                c: '特殊色1'
            }
        }
    },
    primary: {
        _meta: {
            group: '主色'
        },
        keep: [/^primary_\d$/]
    },
    secondary: {
        _meta: {
            group: '次色'
        },
        keep: [/^secondary_\d$/]
    },
    gradient: {
        _meta: {
            group: '渐变色'
        },
        keep: [/^gradient\./]
    },
    assist: {
        _meta: {
            group: '辅助色'
        },
        keep: [
            ...['purple', 'lightblue', 'blue', 'orange', 'yellow', 'cyan', 'red', 'green'].map(
                color => new RegExp(`${color}_`)
            )
        ]
    }
};

const ensureProperty = (obj, string) => {
    const ensure = (_obj, key) => {
        if (!(key in _obj)) _obj[key] = {};
        return _obj[key];
    };
    return string.split('.').reduce((obj, k) => {
        return ensure(obj, k);
    }, obj);
};
const writeBuiltinColor = (type, key, info) => {
    if (info.type === 'buildin') delete info.type;
    Object.assign(ensureProperty(tokenDefine.builtin, `color.${type}.${key}`), info);
};

for (const type in builtinColorMap) {
    const typeInfo = builtinColorMap[type];
    ensureProperty(tokenDefine.builtin, `color.${type}`)._meta = typeInfo._meta;
}
const _metaInfoMap = {
    'common.color.bg': {
        group: '背景色'
    },
    'common.color.line': {
        group: '线条色'
    },
    'common.color.text': {
        group: '文本色'
    },
    'common.color.legend': {
        group: '图例色'
    },
    'common.height': {
        group: '高度'
    },
    'common.width': {
        group: '宽度'
    },
    'common.corner': {
        group: '圆角'
    },
    'common.square': {
        group: '方块'
    },
    'common.spacing': {
        group: '间距'
    },
    'common.shadow': {
        group: '阴影'
    },
    'common.line.width': {
        group: '线条尺寸'
    },
    'common.line.style': {
        group: '线条样式'
    },
    'common.typo': {
        group: '排版'
    }
};

for (const metaTarget in _metaInfoMap) {
    ensureProperty(tokenDefine, metaTarget)._meta = _metaInfoMap[metaTarget];
}

const patchTheColor = (key, color) => {
    if ('value' in color) {
        let write = false;
        outer: for (const type in builtinColorMap) {
            const typeDefine = builtinColorMap[type];
            if (typeDefine.keep) {
                for (let i = 0; i < typeDefine.keep.length; i++) {
                    const keepDefine = typeDefine.keep[i];
                    const finalKey = (() => {
                        const a = key.split('.');
                        return a[a.length - 1];
                    })();
                    if (typeof keepDefine === 'string') {
                        if (keepDefine === key) {
                            writeBuiltinColor(type, finalKey, color);
                            write = true;
                            break outer;
                        }
                    } else if (keepDefine instanceof RegExp && keepDefine.test(key)) {
                        writeBuiltinColor(type, finalKey, color);
                        write = true;
                        break outer;
                    }
                }
            }
            if (typeDefine.rename) {
                if (key in typeDefine.rename) {
                    const { n, c } = typeDefine.rename[key];
                    writeBuiltinColor(type, n, c ? { ...color, comment: c } : color);
                    write = true;
                    break outer;
                }
            }
        }
        for (let i = 0; i < cacheColorKeys.length; i++) {
            const cacheKey = cacheColorKeys[i];
            if (cacheKey.test(key)) {
                cache[key] = color.value;
                return;
            }
        }
        if (/_transparent\.\d+$/.test(key)) {
            // console.error('drop ', key);
            return;
        }
        if (!write) console.error(`Can't find patch info for ${key}`);
    } else {
        for (const subKey in color) {
            patchTheColor(`${key}.${subKey}`, color[subKey]);
        }
    }
};

const patchBuiltinColor = brand => {
    for (const key in brand) {
        patchTheColor(key, brand[key]);
    }
};

const patchColor = color => {
    for (const key in color) {
        if (Object.hasOwnProperty.call(color, key)) {
            switch (key) {
                case 'bg':
                case 'line':
                case 'text':
                case 'legend':
                    override(ensureProperty(tokenDefine.common, `color.${key}`), color[key]);
                    break;
                case 'brand':
                    patchBuiltinColor(color[key]);
                    break;
                default:
                    console.error('unknown', key);
                    break;
            }
        }
    }
};

const patch = patch => {
    for (const key in patch) {
        if (Object.hasOwnProperty.call(patch, key)) {
            switch (key) {
                case 'card':
                case 'button':
                case 'input':
                case 'switch':
                case 'table':
                case 'progress':
                case 'slider':
                case 'popover':
                case 'loading':
                case 'drawer':
                    override(ensureProperty(tokenDefine.component, key), patch[key]);
                    break;
                case 'color': {
                    patchColor(patch[key]);
                    break;
                }
                case 'corner':
                case 'height':
                case 'width':
                case 'line':
                case 'shadow':
                case 'spacing':
                case 'square':
                case 'typo': {
                    override(ensureProperty(tokenDefine.common, key), patch[key]);
                    break;
                }
                case 'frame':
                case 'modal':
                case 'pay':
                case 'scrollbar':
                case 'tabs':
                case 'chart':
                case 'ide':
                case 'chart':
                    override(ensureProperty(tokenDefine.external, key), patch[key]);
                    break;
                default:
                    console.error('unknown', key);
                    break;
            }
        }
    }
};

[...globalTokenDefineFiles, ...defaultTokenDefineFiles, ...files].forEach(file => {
    const content = require(file);
    patch(content);
});

const findInsteadColorKey = color => {
    for (const type in tokenDefine.builtin.color) {
        const typeInfo = tokenDefine.builtin.color[type];
        for (const colorKey in typeInfo) {
            const colorInfo = typeInfo[colorKey];
            if (colorKey === '_meta') continue;
            if (colorInfo.value.toLowerCase() === color.toLowerCase()) return `${type}.${colorKey}`;
        }
    }
};

const replaceDefineKeys = string => {
    const findNewKey = key => {
        for (const type in builtinColorMap) {
            const typeDefine = builtinColorMap[type];
            if (typeDefine.keep) {
                for (let i = 0; i < typeDefine.keep.length; i++) {
                    const keepDefine = typeDefine.keep[i];
                    const finalKey = (() => {
                        const a = key.split('.');
                        return a[a.length - 1];
                    })();
                    if (typeof keepDefine === 'string') {
                        if (keepDefine === key) {
                            return `${type}.${finalKey}`;
                        }
                    } else if (keepDefine instanceof RegExp && keepDefine.test(key)) {
                        return `${type}.${finalKey}`;
                    }
                }
            }
            if (typeDefine.rename) {
                if (key in typeDefine.rename) {
                    const { n, c } = typeDefine.rename[key];
                    return `${type}.${n}`;
                }
            }
        }
    };
    string.replace('isDeprecated', 'deprecated');
    return string.replace(/\{color\.brand\.[.\w]+?\.value\}/g, s => {
        const key = s.replace(/^\{color\.brand\./, '').replace(/\.value\}$/, '');
        const newKey = findNewKey(key);
        if (newKey) return `{color.${newKey}}`;
        if (key in cache) {
            const insteadColorKey = findInsteadColorKey(cache[key]);
            if (insteadColorKey) {
                console.log(`${key} => ${insteadColorKey}`);
                return `{color.${insteadColorKey}}`;
            } else {
                console.error(`${key}: ${cache[key]} ❌❌❌`);
                return cache[key];
            }
        }
        if (/_transparent\.\d+$/.test(key)) {
            const [, transparentKey, opacity] = /^([\w.]+)_transparent\.(\d+)$/.exec(key) || [];
            if (!opacity) {
                console.error(`wrong transparent: ${key}`);
                return '';
            }
            const newKey = findNewKey(transparentKey);
            if (newKey) return `{transparent(color.${newKey},${opacity})}`;
            console.error(transparentKey);
        }
        console.error('wrong', s, key);
        return '';
    });
};

fs.writeFileSync(output, replaceDefineKeys(JSON.stringify(tokenDefine, null, 4)));
