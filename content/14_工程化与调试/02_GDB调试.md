# GDB 调试

## GDB 简介

GDB（GNU Debugger）是 GNU 项目提供的源代码级调试器，用于调试 C/C++ 程序。

## 编译时启用调试信息

使用 `-g` 选项编译程序以包含调试信息。

```bash
gcc -g program.c -o program
```

## GDB 基本用法

### 启动 GDB

```bash
# 启动并加载程序
gdb ./program

# 启动并加载带参数的程序
gdb --args ./program arg1 arg2
```

### 常用命令

| 命令 | 简写 | 说明 |
|------|------|------|
| `break` | `b` | 设置断点 |
| `run` | `r` | 运行程序 |
| `continue` | `c` | 继续执行 |
| `next` | `n` | 单步执行（不进入函数） |
| `step` | `s` | 单步执行（进入函数） |
| `finish` | `fin` | 执行到当前函数返回 |
| `print` | `p` | 打印变量值 |
| `backtrace` | `bt` | 显示调用栈 |
| `list` | `l` | 显示源代码 |
| `quit` | `q` | 退出 GDB |
| `delete` | `d` | 删除断点 |
| `info breakpoints` | `info b` | 显示断点信息 |

## 断点设置

### 按行号设置断点

```gdb
(gdb) break main.c:10
```

### 按函数名设置断点

```gdb
(gdb) break main
(gdb) break calculate_sum
```

### 按条件设置断点

```gdb
(gdb) break main.c:10 if x > 100
```

### 设置临时断点

```gdb
(gdb) tbreak main
```

### 查看断点

```gdb
(gdb) info breakpoints
```

### 删除断点

```gdb
(gdb) delete 1      # 删除断点 1
(gdb) delete        # 删除所有断点
```

## 单步跟踪

### next vs step

- **`next`**：执行下一行，不进入函数内部
- **`step`**：执行下一行，进入函数内部

### 示例

```gdb
(gdb) break main
(gdb) run
(gdb) next          # 执行下一行
(gdb) step          # 进入函数
(gdb) finish        # 执行到函数返回
(gdb) continue      # 继续执行到下一个断点
```

## 查看变量与内存

### 查看变量

```gdb
(gdb) print x
(gdb) print arr[0]
(gdb) print *ptr
(gdb) print arr      # 打印整个数组
```

### 查看内存

```gdb
(gdb) x/10x &arr     # 以十六进制查看 10 个字
(gdb) x/5d &arr      # 以十进制查看 5 个字
(gdb) x/3s ptr       # 以字符串查看 3 个字
(gdb) x/20b ptr      # 以字节查看 20 个字节
```

### 内存格式说明符

| 格式 | 说明 |
|------|------|
| `x` | 十六进制 |
| `d` | 十进制（有符号） |
| `u` | 十进制（无符号） |
| `o` | 八进制 |
| `t` | 二进制 |
| `f` | 浮点数 |
| `s` | 字符串 |
| `i` | 指令 |

### 设置显示格式

```gdb
(gdb) set print pretty on    # 美化输出
(gdb) set print array on     # 显示数组
(gdb) set print elements 100 # 显示最多 100 个元素
```

## 调用栈

### 查看调用栈

```gdb
(gdb) backtrace
(gdb) bt
```

### 查看栈帧

```gdb
(gdb) frame 0      # 查看栈帧 0（当前）
(gdb) frame 1      # 查看栈帧 1
(gdb) frame 2      # 查看栈帧 2
```

### 查看局部变量

```gdb
(gdb) info locals
```

### 查看函数参数

```gdb
(gdb) info args
```

## 条件调试

### 条件断点

```gdb
(gdb) break main.c:20 if i == 5
```

### 观察点

当变量值改变时暂停执行。

```gdb
(gdb) watch x          # 当 x 改变时暂停
(gdb) rwatch x         # 当 x 被读取时暂停
(gdb) awatch x         # 当 x 被读取或写入时暂停
```

### 捕获点

```gdb
(gdb) catch throw      # 捕获 C++ 异常抛出
(gdb) catch catch      # 捕获 C++ 异常捕获
```

## GDB 高级功能

### 动态修改变量

```gdb
(gdb) set variable x = 100
```

### 调用函数

```gdb
(gdb) call printf("Hello from GDB\n")
```

### 反汇编

```gdb
(gdb) disassemble main
(gdb) disassemble /s main   # 显示源代码
```

### 查看寄存器

```gdb
(gdb) info registers
(gdb) print $eax
```

### 多线程调试

```gdb
(gdb) info threads       # 查看所有线程
(gdb) thread 2           # 切换到线程 2
(gdb) break thread 2     # 在线程 2 上设置断点
```

## 段错误排查

段错误（Segmentation Fault）是C程序最常见的运行时错误，通常由空指针解引用、数组越界、访问已释放内存等引起。使用 GDB 可以快速定位段错误发生的位置。

### 用 GDB 定位段错误

```bash
# 1. 用 -g 编译，运行时程序崩溃
gcc -g program.c -o program
./program
# 输出: Segmentation fault (core dumped)

# 2. 启动 GDB 直接运行，程序崩溃时 GDB 会自动停在出错的位置
gdb ./program
(gdb) run
```

程序崩溃后，GDB 会提示发生段错误的行号。再配合 `backtrace` 查看调用链：

```gdb
(gdb) bt          # 查看调用栈，最顶层是出错的函数
(gdb) frame 0     # 切换到出错的那一帧
(gdb) info locals # 查看该函数的局部变量
(gdb) print ptr   # 打印疑似导致崩溃的指针，检查是否为 0x0
```

### 典型段错误与排查示例

```c
#include <stdio.h>

void bad_function(int *p) {
    *p = 42;   // 若 p 为 NULL，此处发生段错误
}

int main(void) {
    int *ptr = NULL;
    bad_function(ptr);
    printf("done\n");
    return 0;
}
```

```gdb
(gdb) run
# Program received signal SIGSEGV, Segmentation fault.
# 0x0000555555555162 in bad_function (p=0x0) at program.c:5
(gdb) bt
# #0  bad_function (p=0x0) at program.c:5
# #1  main () at program.c:10
```

从输出可看出：崩溃发生在 `program.c` 第5行，参数 `p=0x0`，即向空指针写入导致段错误。回到代码检查 `ptr` 未被初始化即可修复。

### 段错误的常见原因

1. **空指针/野指针解引用**：对未初始化或已 `free` 的指针取值
2. **数组越界**：访问超出数组边界的内存
3. **访问已释放内存**：`free` 之后继续使用指针
4. **栈溢出**：递归没有终止条件或递归过深
5. **对字符串常量写入**：修改只读的字符串字面量

## GDB 调试示例

### 完整调试流程

```bash
# 1. 编译时启用调试信息
gcc -g -Wall program.c -o program

# 2. 启动 GDB
gdb ./program

# 3. 设置断点
(gdb) break main
(gdb) break calculate_sum if a > 100

# 4. 运行程序
(gdb) run

# 5. 单步执行
(gdb) next
(gdb) step

# 6. 查看变量
(gdb) print x
(gdb) print arr[0]

# 7. 查看调用栈
(gdb) backtrace

# 8. 继续执行
(gdb) continue

# 9. 退出
(gdb) quit
```

## GDB 配置文件

### .gdbinit 文件

在项目根目录创建 `.gdbinit` 文件：

```
set print pretty on
set print array on
set pagination off
break main
```

## GDB 常用快捷键

| 快捷键 | 命令 |
|--------|------|
| `Ctrl+C` | 中断程序执行 |
| `Ctrl+D` | 退出 GDB |
| `Tab` | 自动补全 |

## GDB 最佳实践

1. **始终使用 `-g` 编译**
2. **使用 `-O0` 禁用优化**（优化可能改变代码执行顺序）
3. **使用条件断点减少中断次数**
4. **使用观察点监控变量变化**
5. **使用 `finish` 快速跳出函数**
6. **使用 `until` 跳出循环**