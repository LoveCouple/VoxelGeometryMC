# Voxel Geometry

![logo](https://raw.githubusercontent.com/CAIMEOX/VoxelGeometry/webviewer/gallery/logo.png)

**Voxel Geometry** 是基于 Minecraft Script API 的一个几何结构构造库（类似 World Edit，但更专注于几何学，也更复杂）。它支持原生 JavaScript 语法，这也意味着它是图灵完备的。如果你熟悉 JavaScript，你可以将 Voxel Geometry 视为对 Minecraft 世界产生“影响”的几何库。

类似像素，**体素（Voxel）** 表示三维空间中网格上的一个数值。**Geometry** 意味着这个软件在**数学上**非常强大，并具有以下功能来生成令人惊叹的结构。

-   **基本几何图形**：球体、圆、圆柱、环面、线条等等。
-   **Lindenmayer 系统**（L-System）：一种并行的重写系统。L-System 规则的递归特性导致了自相似性，从而可以用 L-System 轻松描述类似分形的形式。
-   **海龟绘图**：具有完整功能和 3D 扩展的海龟绘图。
-   **函数式风格**： Voxel Geometry 包含一个强大的简单 JavaScript 函数式编程工具集，称为 [Pure Eval](https://github.com/PureEval/PureEval.git)。这使得你可以将函数组合在一起构建更复杂的结构。
-   **变换器**：通过管道、组合、缩放、扩散等将空间转换为另一个空间。
-   **表达式绘制**：通过数学表达式或参数方程构建结构。
-   **Canvas API**：支持 JavaScript 浏览器图形 API Canvas。
-   **线性和非线性变换**：将一个空间映射到另一个空间。
-   **扩散限制聚集**：模拟由于布朗运动而随机行走的粒子聚集在一起形成聚集体的过程。
-   **混沌**：迭代函数系统。

## 截图

你可以在 [画廊](https://github.com/CAIMEOX/VoxelGeometry/tree/webviewer/gallery#readme) 找到更多信息

## 安装

对于用户来说，只需要从 **release** 页面下载 **mcpack** 文件。

如果你想进一步开发 Voxel Geometry ，请参照下列步骤：

-   克隆仓库：

    ```bash
    git clone https://github.com/LoveCouple/VoxelGeometryMC
    ```

-   确保你已经安装了 nodejs 和 gulp。

    ```bash
    gulp build # 构建并加载用于VG Viewer的测试文件
    gulp # 构建并部署（多平台）
    ```

## 基本概念

### 控制台（Console）

游戏中的**聊天**窗口就是**控制台**，你可以通过它与 Voxel Geometry 进行交互。Voxel Geometry 的命令以 `-` 开头，并支持 JavaScript 语法。（在下面的文档中，我们将忽略这个标记。）

### 空间

许多 Voxel Geometry 函数会返回一个**空间**（Space），也就是一组 3 维向量。

### 语法

Voxel Geometry 支持函数、数组、数字、字符串等数据类型。你可以通过一些基本函数的组合来实现所有功能。

#### 函数应用

```javascript
function(arg1, arg2, ...)
```

#### 变量

定义一个变量：

```javascript
let name = value;
```

## 影响

Voxel Geometry 中的大多数函数都是纯函数（没有副作用的函数），这意味着它们**不能**对 Minecraft 世界产生任何影响。只有部分函数具有影响 Minecraft 世界的能力。

### 绘制（Plot）

大多数函数返回空间（Space），但这不会影响世界，你需要使用函数 **plot** 将空间映射到 Minecraft 世界。

```javascript
plot(space:Space)
plot(sphere(5, 4)) # 生成一个空心球体
```

### 获取位置

使用函数 **pos** 可以获取玩家的位置，并将其设置为**绘制**时的**原点**（origin）。

```javascript
pos();
```

### 画刷

函数 `brush` 接受一个空间作为参数，它会将这个空间**映射**到你用**木棍**（stick）右键点击的位置。

```javascript
brush(sphere(5, 1));
// 如果你想禁用这个功能，传入空参数即可
place();
```

### 放置模式（Place Mode）

函数 `place` 接受一个空间作为参数，它会将这个空间**映射**到你放置方块的位置。

```javascript
place(sphere(5, 4));
// 如果你想禁用这个功能，传入空参数即可
place();
```

## 基本几何图形

### 球体（Sphere）

创建一个具有半径的球体。

```typescript
sphere(radius: number, inner_radius: number):Space
plot(sphere(5, 4))
```

### 圆（Circle）

创建一个具有半径的圆。

```typescript
circle(radius: number, inner_radius: number):Space
plot(circle(5, 4))
```

### 环面（Torus）

创建一个环面。

```typescript
torus(radius: number, ringRadius: number):Space
plot(torus(10, 8))
```

## 变换器

### 缩放（scale）

将一个空间放大（缩放）。

```typescript
scale(space: Space, size: number): Space
```

### 交换（swap）

改变空间的方向。

```typescript
swap(space: Space, d1: number, d2: number): Space
```

### 管道（pipe）

将前一个空间的点作为下一个空间的原点。

```typescript
pipe(...spaces: Space[]): Space
```

### 扩散（diffusion）

按比例扩散空间中的点。

```typescript
diffusion(space: Space, factor: number): Space
```

### 移动（move）

将一个空间移动到特定点。

```typescript
move(space: Space, dest: Vector3): Space
```

### 嵌入（embed）

将一个空间嵌入另一个空间。

```typescript
embed(base: Space, target: Space):Space
```

### 阵列生成器

生成一个具有离散点集的空间（前三个变量表示三个方向的点的个数，后三个变量表示点的间距）

```typescript
array_gen(
    x_count: number,
	y_count: number,
	z_count: number,
    dx: number, dy: number, dz: number): Space
```

也可以输入自定义生成函数，可以更灵活定义点间距

```typescript
array_gen_fn(
	x_count: number,
	y_count: number,
	z_count: number,
	int_x: (a: number) => number,
	int_y: (a: number) => number,
	int_z: (a: number) => number
): Space
```

## 海龟绘图（Turtle）

### 二维海龟（Turtle2D）

海龟绘图是一种使用相对光标（即“海龟”）在笛卡尔平面（x 轴和 y 轴）上进行的矢量图形。

Voxel Geometry 支持海龟绘图的基本函数：

```javascript
// 绘制长度为10的直线
const t = new Turtle2D();
t.forward(10);
plot(t.getTrack());
```

### 三维海龟（Turtle3D）

与二维海龟相同，但它生存在三维空间中，也就是说它可以抬头或者低头。

## L-系统（L-System）

L-系统或 Lindenmayer 系统是一种并行的重写系统，属于一种形式文法。它由**字母表**（alphabet）、一系列**产生规则**（production rules，将每个符号扩展为更大的符号串）、一个初始的**公理**（axiom）字符串以及一个将生成的字符串转化为几何结构的**机制**（例如海龟绘图）组成。

在 Voxel Geometry 中，你可以使用以下函数创建一个带括号的 L-系统（Bracketed L-system）：

```typescript
lsystem(
	axiom: string,
	rules: { [key: string]: string },
	generation: number,
	angle: number
): Space
```

例如，我们可以通过使用 L-系统创建 Peano 曲线：

```javascript
lsystem(
	'X',
	{
		X: 'XFYFX+F+YFXFY-F-XFYFX',
		Y: 'YFXFY-F-XFYFX+F+YFXFY'
	},
	5
);
```

Voxel Geometry 默认使用海龟绘图（Turtle Graphics）作为机制。

## Canvas

Voxel Geometry 在浏览器中支持部分 Canvas API。

## 表达式解释器

### 参数方程（Parametric Equation）

参数方程通常用于表示构成几何对象（如曲线或曲面）的点的坐标。它包括一组作为一个或多个独立变量（称为**参数**）的函数的量。

例如，我们可以写出椭圆的参数方程。（t 是参数，其取值范围从 0 到 2π）

```javascript
// a和b是常数
x = a * cos(t);
y = b * sin(t);
```

在 Voxel Geometry 中表示如下（`step` 表示参数的变化步长）：

```javascript
simple_parametric(
	expr_x: string,
	expr_y: string,
	expr_z: string,
	...intervals: Interval[][]
): Vec3[]
let step = 0.1;
plot(simple_parametric('5*Math.cos(t)', '0', '10*Math.sin(t)', ['t', 0, Math.PI * 2, step]));
```

### 表达式（Expression）

根据数学表达式（如不等式）作为条件和区间，构造满足条件的空间：

```typescript
simple_equation(expr: string, start: number, end: number, step: number): Space
```

例如，我们可以构造一个球体：

```typescript
plot(simple_equation('x*x+y*y+z*z<=5', -5, 5, 1));
```
