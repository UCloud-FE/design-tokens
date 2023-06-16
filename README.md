# Design tokens

## 层级命名规范

- builtin 内建变量
  1.  颜色/尺寸 color、size
  2.  分类
  3.  颜色命名，无语义
- common
  1.  类型 bg-color、font-size、padding、width、height、shadow、border-color
  2.  状态（可选）
      - 操作状态 default、hover、active、disabled
      - 提示、交互状态：error
      - 组合：error-hover、error-disabled
- 组件/应用范围 component、frame、scrollbar
  1. 使用场景（可选）
     - 组件切割位置 mask、layer、row
     - 场景 primary、default
     - 组合：layer-primary、primary-layer
  2. 类型 bg-color、font-size、padding、width、height、shadow、border-color
  3. 状态（可选）
     - 操作状态 default、hover、active、disabled
     - 提示、交互状态：error
     - 组合：error-hover、error-disabled

举例

```json
{
  "builtin": {
    "color": {
      "environment": {
        "white": {
          "value": "#FFF",
          "comment": "环境白"
        },
        "black": {
          "value": "#000",
          "comment": "环境黑"
        }
      }
    }
  },
  "button": {
    "color": {
      "bg": {
        "mask": {
          "primary": {
            "disabled": {
              "value": "gray",
              "comment": "按钮背景/遮罩层/主按钮/禁用"
            }
          }
        }
      }
    }
  }
}
```
