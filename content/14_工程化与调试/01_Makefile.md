# Makefile 基础

## 什么是 Makefile

Makefile 是一个用于描述软件编译规则的文件，`make` 工具根据 Makefile 自动执行编译、链接等操作。

### make 的工作原理

`make` 依据 Makefile 中的**依赖关系**判断哪些文件需要重新编译：

1. 检查目标文件与依赖文件的**修改时间**（时间戳）
2. 若目标文件不存在，或依赖文件比目标文件**更新**，则执行该规则对应的命令重新生成目标
3. 依赖关系是**递归**的：要生成最终程序，先要生成其依赖的目标文件，于是逐层向下执行
4. 若目标比所有依赖都新，则**跳过**该规则（无需重新编译），这避免了每次全量编译

例如对规则 `hello: hello.o`，若 `hello.o` 比 `hello.c` 新，则不再重新编译 `hello.o`，只做链接。正是这种"按需编译"机制，让大型项目增量构建变得高效。

## 基本语法

### 目标: 依赖

```makefile
target: dependencies
	commands
```

- **target**：目标文件名
- **dependencies**：依赖文件
- **commands**：执行的命令（必须以 Tab 键开头）

### 示例

```makefile
# 编译 C 程序
hello: hello.c
	gcc -Wall -g hello.c -o hello
```

## 变量

### 定义变量

```makefile
CC = gcc
CFLAGS = -Wall -g
TARGET = hello
```

### 使用变量

```makefile
$(CC) $(CFLAGS) hello.c -o $(TARGET)
```

### 自动化变量

| 变量 | 含义 |
|------|------|
| `$@` | 目标文件名 |
| `$<` | 第一个依赖文件 |
| `$^` | 所有依赖文件 |
| `$*` | 目标文件名（不含扩展名） |

## 编译规则

### 编译 C 文件

```makefile
CC = gcc
CFLAGS = -Wall -g

hello: hello.o
	$(CC) $(CFLAGS) hello.o -o hello

hello.o: hello.c
	$(CC) $(CFLAGS) -c hello.c -o hello.o
```

### 使用模式规则

```makefile
CC = gcc
CFLAGS = -Wall -g

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@
```

### 链接多个目标文件

```makefile
CC = gcc
CFLAGS = -Wall -g

program: main.o utils.o math.o
	$(CC) $(CFLAGS) main.o utils.o math.o -o program

main.o: main.c
	$(CC) $(CFLAGS) -c main.c -o main.o

utils.o: utils.c utils.h
	$(CC) $(CFLAGS) -c utils.c -o utils.o

math.o: math.c math.h
	$(CC) $(CFLAGS) -c math.c -o math.o
```

## 伪目标

### clean

```makefile
.PHONY: clean

clean:
	rm -f *.o program
```

### all

```makefile
.PHONY: all

all: program

program: main.o utils.o
	$(CC) main.o utils.o -o program
```

## 条件编译

```makefile
CC = gcc
CFLAGS = -Wall -g

DEBUG = 1

ifeq ($(DEBUG), 1)
	CFLAGS += -DDEBUG
endif

program: main.c
	$(CC) $(CFLAGS) main.c -o program
```

## 常用 Makefile 模式

### 简单项目

```makefile
CC = gcc
CFLAGS = -Wall -g
TARGET = myapp
SRCS = main.c utils.c math.c
OBJS = $(SRCS:.c=.o)

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) $(OBJS) -o $(TARGET)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS) $(TARGET)

.PHONY: all clean
```

### 带头文件依赖

```makefile
CC = gcc
CFLAGS = -Wall -g
TARGET = myapp
SRCS = main.c utils.c math.c
OBJS = $(SRCS:.c=.o)
DEPS = main.h utils.h math.h

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) $(OBJS) -o $(TARGET)

%.o: %.c $(DEPS)
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS) $(TARGET)

.PHONY: all clean
```

## Makefile 最佳实践

1. **使用变量管理编译选项**
2. **使用模式规则减少重复**
3. **使用 `.PHONY` 声明伪目标**
4. **使用自动化变量简化规则**
5. **添加 `clean` 目标**
6. **使用 `make -j` 并行编译**
7. **使用 `make -n` 预览命令**

## 常用 make 命令

```bash
# 编译
make

# 清理
make clean

# 并行编译
make -j4

# 预览命令
make -n

# 指定 Makefile
make -f MyMakefile

# 指定变量
make DEBUG=1
```
