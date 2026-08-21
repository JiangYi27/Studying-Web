/* ============================================================
 * 新增题库数据（第 8-11 章）— 参考谭浩强《C语言程序设计》
 * 每章 20 道，重点覆盖易混易错点
 * 难度: 1=基础 2=中等 3=困难
 * ============================================================ */
'use strict';

module.exports = {
    '08': [
        {
            question: "`struct S { char c; int i; };` 在 32 位平台上 sizeof(struct S) 通常是？",
            options: ["8（char 后有 3 字节填充对齐）", "5", "6", "12"],
            correct: 0, difficulty: 3,
            explanation: "int 需要 4 字节对齐，char 占第 0 字节后，第 1~3 字节被填充，int 从第 4 字节开始，总大小为 8。这就是结构体对齐与填充。"
        },
        {
            question: "联合体（union）的 sizeof 由什么决定？",
            options: ["最大成员的大小（并按最大对齐要求对齐）", "所有成员大小之和", "第一个成员的大小", "最后一个成员的大小"],
            correct: 0, difficulty: 2,
            explanation: "联合体的所有成员共享同一块内存，其大小至少等于最大成员的大小（还要满足对齐）。与结构体相加不同，union 是取最大。"
        },
        {
            question: "`#pragma pack(1)` 的作用是？",
            options: ["把结构体按 1 字节对齐，取消填充（节省空间但可能降低性能）", "把结构体按最大成员对齐", "产生编译错误", "没有任何效果"],
            correct: 0, difficulty: 2,
            explanation: "`#pragma pack(1)` 强制 1 字节对齐，消除填充字节，用于网络协议、文件格式等需要紧凑布局的场景。代价是可能非对齐访问，影响性能与可移植性。"
        },
        {
            question: "定义含 10 个 `struct Point` 的数组，正确写法是？",
            options: ["`struct Point pts[10];`", "`struct Point pts = 10;`", "`Point[10] pts;`", "`struct pts[10] Point;`"],
            correct: 0, difficulty: 1,
            explanation: "结构体数组的声明与普通数组一致：`struct Point pts[10];`。访问元素用 `pts[i].x`。"
        },
        {
            question: "通过结构体指针 p 访问成员，使用？",
            options: ["`p->member`", "`p.member`", "`*p.member`", "`p..member`"],
            correct: 0, difficulty: 1,
            explanation: "结构体指针用箭头 `->` 访问成员，等价于 `(*p).member`。点号 `.` 用于结构体变量本身。"
        },
        {
            question: "两个结构体变量直接赋值 `s1 = s2;` 会发生什么？",
            options: ["逐成员浅拷贝（若含指针则只是拷贝指针值）", "编译错误", "共享同一块内存", "只拷贝第一个成员"],
            correct: 0, difficulty: 2,
            explanation: "结构体可以直接整体赋值，执行逐成员拷贝（浅拷贝）。若含指针成员，只复制指针值，两个结构体将指向同一块数据。"
        },
        {
            question: "结构体的位域（bit-field）成员不能进行哪个操作？",
            options: ["取地址（&s.bit 是非法的）", "读取值", "赋值", "在 if 条件中使用"],
            correct: 0, difficulty: 3,
            explanation: "位域成员可能不占据完整字节、没有独立地址，因此标准禁止对其取地址 `&`。但可以读写。"
        },
        {
            question: "枚举（enum）的每个成员默认的底层类型大小通常是？",
            options: ["int", "char", "unsigned long", "由运行时决定"],
            correct: 0, difficulty: 2,
            explanation: "C 标准规定 enum 兼容某种整型，实现通常使用 int。成员值默认从 0 开始递增，可显式指定。"
        },
        {
            question: "typedef 与 #define 的核心区别是？",
            options: ["typedef 由编译器处理且做类型检查，#define 是纯文本替换", "typedef 是文本替换", "两者毫无区别", "#define 有类型检查"],
            correct: 0, difficulty: 2,
            explanation: "typedef 是编译期特性，创建类型别名且遵循作用域、能参与类型检查；#define 只是预处理器文本替换，无类型概念。"
        },
        {
            question: "结构体能否包含另一个结构体类型的成员？",
            options: ["可以，作为普通成员嵌套", "不可以", "只有 C++ 可以", "必须用指针"],
            correct: 0, difficulty: 1,
            explanation: "结构体可以嵌套包含其他结构体作为成员（值嵌套）。但注意不能无限包含自身类型的『实例』，只能包含指向自身的指针。"
        },
        {
            question: "链表节点要实现自引用（指向下一个节点），成员必须用？",
            options: ["指向同类型结构体的指针，如 `struct Node *next;`", "同类型结构体实例", "联合体", "数组"],
            correct: 0, difficulty: 2,
            explanation: "结构体不能包含自身的实例（会无限递归导致大小无穷），但可以包含指向自身类型的指针。链表、树都靠指针自引用。"
        },
        {
            question: "联合体中以 int 写入、以 double 读取，会？",
            options: ["标准上属未定义行为（读取非激活成员）", "自动类型转换", "正常工作", "编译报错"],
            correct: 0, difficulty: 3,
            explanation: "读取 union 中非激活（未写入）的成员，按标准是未定义行为。实践中常用于类型双关（type punning），但 GCC/Clang 有扩展保证其行为。"
        },
        {
            question: "结构体较大时按值传给函数开销很大，推荐的写法是？",
            options: ["传结构体指针（如 `const struct S *`）", "仍然按值传", "用全局变量代替", "用宏展开"],
            correct: 0, difficulty: 2,
            explanation: "按值传结构体会复制整个结构体，开销随大小增长。传指针只复制一个地址，配合 const 表明只读意图，是推荐做法。"
        },
        {
            question: "成员的声明顺序会影响 sizeof 吗？",
            options: ["会影响（不同排列的填充不同）", "完全不影响", "只影响运行速度", "取决于编译器版本"],
            correct: 0, difficulty: 3,
            explanation: "按从大到小或从小到大合理排列成员可减少填充。如 `char, int, char` 是 12 字节，而 `int, char, char` 是 8 字节。"
        },
        {
            question: "结构体成员可以是数组吗？",
            options: ["可以，如 `char name[32];`", "不可以", "只能是一维数组", "只能是 char 数组"],
            correct: 0, difficulty: 1,
            explanation: "结构体成员可以是任意类型，包括数组、指针、其他结构体、union 等。数组成员会被整体拷贝。"
        },
        {
            question: "C11 的匿名结构体/联合体（anonymous struct/union）的用途是？",
            options: ["把嵌套类型成员当作外层直接成员访问，简化代码", "减少内存占用", "加快编译", "替代 typedef"],
            correct: 0, difficulty: 2,
            explanation: "匿名嵌套结构体/联合体使得内层成员可被直接通过外层变量访问（如 `s.x` 而非 `s.inner.x`），常用于包装结构。"
        },
        {
            question: "位域的跨平台主要问题在于？",
            options: ["位分配方向（大端/小端）和存储布局由实现定义，不可移植", "无法读取值", "无法给位域赋值", "编译必定失败"],
            correct: 0, difficulty: 3,
            explanation: "位域是从高位还是低位开始分配、跨字节边界的行为都未标准化，因此在网络协议等场景使用位域需谨慎，必要时改用位掩码。"
        },
        {
            question: "`typedef int Arr[5]; Arr a;` 表示 a 是？",
            options: ["含 5 个 int 的数组", "int* 指针", "函数", "编译错误"],
            correct: 0, difficulty: 3,
            explanation: "typedef 可以为数组类型取别名，`Arr a` 等价于 `int a[5]`。这是 typedef 常被忽略的用途之一。"
        },
        {
            question: "结构体默认的对齐规则通常是？",
            options: ["每个成员对齐到其自身大小的整数倍，结构体整体对齐到最大成员对齐值", "全部按 1 字节对齐", "由代码书写顺序决定", "没有规则"],
            correct: 0, difficulty: 3,
            explanation: "常见规则（ABI 定义）：成员按其对齐值（通常等于其大小）对齐；结构体总大小必须是最大成员对齐值的整数倍。可用 `_Alignof` 查看。"
        },
        {
            question: "访问 union 中尚未激活（未写入）的成员的值？",
            options: ["标准上属未定义行为", "一定会得到正确值", "一定是 0", "编译报错"],
            correct: 0, difficulty: 3,
            explanation: "标准规定只能读取最近写入的成员（激活成员）。读取其他成员的值是未定义行为，但许多编译器在整型之间实现为位模式重解释。"
        }
    ],

    '09': [
        {
            question: "`#define PI 3.14` 中的 PI 是？",
            options: ["无类型的宏，预处理期纯文本替换为 3.14", "浮点常量变量", "const 变量", "函数"],
            correct: 0, difficulty: 1,
            explanation: "宏在预处理阶段被文本替换为 3.14，没有类型、没有作用域、不做类型检查。与 const 常量有本质区别。"
        },
        {
            question: "`#define MAX(a,b) a>b?a:b` 调用 `MAX(i++, j)` 时的问题？",
            options: ["参数被多次求值，i++ 可能执行多次或产生副作用", "完全安全", "编译错误", "i 保持不变"],
            correct: 0, difficulty: 3,
            explanation: "宏是文本替换，a 出现几次就被替换几次。`MAX(i++,j)` 展开为 `i++>j?i++:j`，i++ 被执行两次。这是宏的经典副作用陷阱。"
        },
        {
            question: "宏定义的有效范围是？",
            options: ["从定义处到文件末尾，或遇到 #undef 为止", "整个程序", "当前函数内", "当前一行"],
            correct: 0, difficulty: 2,
            explanation: "宏的作用域从 #define 处开始，到文件结束或 #undef。它不受函数作用域限制，也没有块级作用域。"
        },
        {
            question: "`#define ADD(a,b) ((a)+(b))` 使用双层括号的原因是？",
            options: ["防止外层表达式因运算符优先级出错", "加快展开", "语法必须如此", "减少展开体积"],
            correct: 0, difficulty: 2,
            explanation: "参数和外层各加一层括号，确保 `ADD(a,b)*2` 展开为 `((a)+(b))*2` 而不是 `(a)+(b)*2`。加括号是宏的安全写法。"
        },
        {
            question: "宏能否递归展开？",
            options: ["不能，预处理器会阻止自我递归", "可以", "可以但仅限一层", "取决于宏参数"],
            correct: 0, difficulty: 1,
            explanation: "宏不支持递归：在展开过程中遇到与当前宏同名的记号，预处理器不再展开它。"
        },
        {
            question: "`#ifdef X` 与 `#if defined(X)` 的区别是？",
            options: ["#ifdef 只能判断单个宏，#if defined() 可以用逻辑运算符组合多个条件", "两者完全等价", "前者更强", "后者只能判断单个"],
            correct: 0, difficulty: 2,
            explanation: "`#if defined(A) && !defined(B)` 能表达复杂条件，`#ifdef` 只能判断一个。功能上有重叠，但 defined() 更灵活。"
        },
        {
            question: "防止头文件被重复包含，哪种做法是有效的？",
            options: ["include guard（#ifndef/#define/#endif）和 #pragma once 都可以", "只有 include guard 有效", "只有 #pragma once 有效", "无法避免重复包含"],
            correct: 2, difficulty: 1,
            explanation: "include guard 是标准做法，`#pragma once` 是广为支持的编译器扩展，两者都能防止重复包含。#pragma once 更简洁但可移植性略差。"
        },
        {
            question: "`#pragma once` 与 include guard 相比？",
            options: ["是编译器扩展、非标准但普遍支持", "是 C 标准要求的", "执行更慢", "只能用于 C++"],
            correct: 0, difficulty: 2,
            explanation: "#pragma once 是大多数主流编译器（GCC、Clang、MSVC）支持的扩展，不是标准 C 的一部分，但实际可移植性已足够好。"
        },
        {
            question: "宏定义中 `##` 运算符的作用是？",
            options: ["把两个记号连接成一个新的记号", "把参数转为字符串", "注释一段代码", "比较两个参数"],
            correct: 0, difficulty: 2,
            explanation: "`##`（token pasting）将左右两个记号拼接，如 `#define CAT(a,b) a##b`，CAT(foo,bar) 变成 foobar。"
        },
        {
            question: "宏定义中单个 `#` 运算符的作用是？",
            options: ["把宏参数转换为字符串字面量", "连接两个记号", "取地址", "结束宏定义"],
            correct: 0, difficulty: 2,
            explanation: "单个 `#`（stringizing）把参数原样转为带引号的字符串，如 `#define STR(x) #x`，STR(hello) 变成 \"hello\"。"
        },
        {
            question: "预定义宏 `__LINE__` 展开后是？",
            options: ["当前源文件行号（整型常量）", "当前文件名", "当前日期", "当前时间"],
            correct: 0, difficulty: 1,
            explanation: "__LINE__ 展开为当前行号整数，__FILE__ 是文件名，常用于日志与断言消息。"
        },
        {
            question: "预处理阶段是否进行类型检查？",
            options: ["不做，纯文本替换", "做完整的类型检查", "检查一部分", "检查宏参数类型"],
            correct: 0, difficulty: 2,
            explanation: "预处理器不理解类型，只做文本处理。类型检查发生在编译阶段。因此宏的错误往往在展开后编译时才暴露。"
        },
        {
            question: "`#define SWAP(a,b) { a^=b; b^=a; a^=b; }` 作为宏放在 if/else 中的问题？",
            options: ["花括号后加分号会导致 else 前语法错误，应改用 do{...}while(0)", "没有副作用", "交换结果错误", "编译必定失败"],
            correct: 0, difficulty: 3,
            explanation: "`if(x) SWAP(a,b); else ...` 展开后是 `if(x) { ... }; else`，多余的分号导致语法错误。用 `do{...}while(0)` 包裹可避免。"
        },
        {
            question: "`#if sizeof(int) == 4` 是否可行？",
            options: ["不可行，预处理阶段不知道类型的大小", "可行", "会报错", "结果取决于编译器"],
            correct: 0, difficulty: 3,
            explanation: "#if 中只能使用整型常量表达式，sizeof 在预处理阶段不计算（此时尚无类型信息）。应改用 `#if UINTPTR_MAX` 或编译器宏判断。"
        },
        {
            question: "`#ifdef DEBUG` 常用于？",
            options: ["条件编译调试代码，发布时关闭", "定义函数", "引入库", "取消宏"],
            correct: 0, difficulty: 1,
            explanation: "开发时用 `-DDEBUG` 定义 DEBUG 宏启用调试代码，发布时不定义即自动移除，是常见的调试手段。"
        },
        {
            question: "宏定义要跨多行书写，使用？",
            options: ["行尾加反斜杠 `\\` 续行", "花括号", "逗号", "缩进"],
            correct: 0, difficulty: 2,
            explanation: "宏定义很长时，在每行末尾加反斜杠 `\\` 表示续行，下一行接着写。注意反斜杠后不能有空格。"
        },
        {
            question: "与普通函数相比，函数宏（宏函数）的缺点是？",
            options: ["参数被多次求值、无类型检查、可能代码膨胀", "运行更慢", "无法返回结果", "不能接受参数"],
            correct: 0, difficulty: 3,
            explanation: "宏的缺点正是它只是文本替换：参数副作用、无类型检查、每次使用都内联展开导致代码体积增大。现代 C 更推荐用内联函数。"
        },
        {
            question: "`#define M(x) x+1`，调用 `M(a) * 2` 展开为？",
            options: ["`a+1*2`（未加括号导致优先级错误）", "`(a+1)*2`", "`a+2`", "语法错误"],
            correct: 0, difficulty: 3,
            explanation: "展开为 `a+1*2`，乘法优先于加法，结果与期望的 `(a+1)*2` 不同。定义宏时应把每个参数和外层都加括号。"
        },
        {
            question: "`#error` 指令的作用是？",
            options: ["在预处理阶段产生编译错误并输出自定义消息", "忽略后续代码", "产生警告", "跳过当前文件"],
            correct: 0, difficulty: 1,
            explanation: "`#error 消息` 用于在条件编译中主动终止编译并给出错误信息，常用于检查不支持的环境。"
        },
        {
            question: "变参宏 `#define LOG(...) printf(__VA_ARGS__)` 中的 `__VA_ARGS__` 表示？",
            options: ["宏调用中省略号对应的全部可变参数", "文件名", "行号", "返回地址"],
            correct: 0, difficulty: 3,
            explanation: "`__VA_ARGS__` 代表 `...` 捕获的实参列表，展开后原样插入调用处，使 LOG(\"%d\", x) 变成 printf(\"%d\", x)。"
        }
    ],

    '10': [
        {
            question: "`printf(\"%d\", 5.5);` 会发生什么？",
            options: ["未定义行为：格式串与实际参数类型不匹配，输出垃圾值", "打印 5", "打印 5.5", "编译错误"],
            correct: 0, difficulty: 3,
            explanation: "%d 期望 int，却传入 double。printf 不检查参数类型，会按错误类型解释内存位模式，结果不可预测（未定义行为）。"
        },
        {
            question: "`scanf(\"%d\", n);`（n 是 int，忘写 &）会？",
            options: ["未定义行为：把 n 的值当地址写入，通常崩溃", "正常读取", "自动取地址", "编译错误"],
            correct: 0, difficulty: 2,
            explanation: "scanf 需要变量地址才能写入。`&n` 是地址，`n` 是值，把值当地址写会导致段错误或破坏内存。"
        },
        {
            question: "`getchar()` 的返回类型是 int 而不是 char，原因是？",
            options: ["为了能返回 EOF（通常是 -1）来区分正常字符", "提高运行速度", "历史遗留无意义", "便于内存对齐"],
            correct: 0, difficulty: 1,
            explanation: "getchar 需要同时返回 0~255 的字符和 EOF（-1）。char 无法表示 256 个不同值，所以用 int。用 char 存 getchar 返回值是常见错误。"
        },
        {
            question: "`strcmp(s1, s2)` 返回 0 表示？",
            options: ["两字符串相等", "s1 更小", "发生错误", "长度相同但内容不同"],
            correct: 0, difficulty: 2,
            explanation: "strcmp 返回 0 表示两串完全相等，负数/正数分别表示 s1 小于/大于 s2。注意不要用 `!strcmp` 来表示相等。"
        },
        {
            question: "相比 atoi，strtol 的优势是？",
            options: ["能检测转换错误并可指定进制", "速度更快", "支持浮点数", "两者没有区别"],
            correct: 0, difficulty: 2,
            explanation: "strtol 通过 endptr 报告停止位置、可检测溢出（检查 errno）、支持 2~36 进制。atoi 无法区分 0 与转换失败。"
        },
        {
            question: "`srand(time(NULL));` 的目的是？",
            options: ["用当前时间做种子，使每次运行的 rand 序列不同", "加快随机数生成", "清空屏幕", "对随机数排序"],
            correct: 0, difficulty: 1,
            explanation: "rand 是伪随机序列，相同种子产生相同序列。srand(time(NULL)) 让每次运行序列不同。只应调用一次。"
        },
        {
            question: "memcpy 与 memmove 在处理源/目标内存重叠时的区别是？",
            options: ["memmove 能正确处理重叠，memcpy 重叠时行为未定义", "memcpy 能处理重叠", "两者相同", "memmove 更快"],
            correct: 0, difficulty: 2,
            explanation: "标准只保证 memmove 在重叠时安全（如同临时缓冲再复制），memcpy 要求不重叠。重叠用 memcpy 是未定义行为。"
        },
        {
            question: "相比 sprintf，`snprintf(buf, n, ...)` 的好处是？",
            options: ["限制最多写入 n-1 个字符并保证 '\\0' 结尾，防止缓冲区溢出", "速度更快", "支持更多格式符", "自动换行"],
            correct: 0, difficulty: 2,
            explanation: "snprintf 指定缓冲大小，写满即停止并补 '\\0'，从根本上避免 sprintf 的缓冲区溢出漏洞。"
        },
        {
            question: "printf 的返回值是？",
            options: ["成功输出的字符总数", "总是 0", "一个布尔成功标志", "无返回值"],
            correct: 0, difficulty: 1,
            explanation: "printf 返回实际输出的字符数，出错返回负值。检查返回值可判断写入是否成功。"
        },
        {
            question: "`fflush(stdout);` 的作用是？",
            options: ["立即把标准输出缓冲区的内容刷到终端/文件", "清空标准输入", "关闭标准输出", "无任何作用"],
            correct: 0, difficulty: 2,
            explanation: "stdout 默认缓冲，fflush 强制立刻输出缓冲内容。常用于『printf 后无换行但希望立即显示』的场景。"
        },
        {
            question: "`rand() % 6 + 1` 能生成？",
            options: ["1 ~ 6 的随机数", "0 ~ 5", "0 ~ 6", "6 ~ 12"],
            correct: 0, difficulty: 1,
            explanation: "rand()%6 得 0~5，加 1 得 1~6。注意 rand()%n 存在模偏差（modulo bias），对均匀性要求高的场合应使用更好的方法。"
        },
        {
            question: "`abs()` 在 <stdlib.h>，`fabs()` 在哪个头文件？",
            options: ["<math.h>", "<stdio.h>", "<string.h>", "<ctype.h>"],
            correct: 0, difficulty: 3,
            explanation: "整数绝对值 abs() 在 <stdlib.h>，浮点绝对值 fabs() 在 <math.h>。两者易混淆，用错头文件会因隐式声明而出错。"
        },
        {
            question: "qsort 的比较函数返回值含义是？",
            options: ["负数表示 a<b，0 表示相等，正数表示 a>b", "只返回 0 或 1", "返回是否相等", "返回交换标志"],
            correct: 0, difficulty: 3,
            explanation: "比较函数返回 a 与 b 的大小关系：<0 表示 a 排前面，>0 表示 b 排前面。很多初学者写反导致排序顺序颠倒。"
        },
        {
            question: "`sscanf(str, \"%d\", &n)` 的作用是？",
            options: ["从字符串 str 中解析整数", "把整数写入字符串", "从文件读取", "把字符串转为大写"],
            correct: 0, difficulty: 2,
            explanation: "sscanf 从内存字符串中按格式解析，相当于 fscanf 的字符串版本。常用于从字符串中提取数字。"
        },
        {
            question: "`strtok(str, \",\")` 的特点与隐患是？",
            options: ["会修改原字符串，且使用静态缓冲区、非线程安全", "不修改原串", "线程安全", "自动分配新内存"],
            correct: 0, difficulty: 3,
            explanation: "strtok 把分隔符替换为 '\\0' 破坏原串，且用静态存储记住位置，多线程并发调用会串。POSIX 提供了线程安全的 strtok_r。"
        },
        {
            question: "`isalpha(c)` 的参数类型是？",
            options: ["int（通常是 EOF 或 unsigned char 提升后的值）", "char*", "double", "unsigned char*"],
            correct: 0, difficulty: 2,
            explanation: "ctype 函数参数是 int，须为 EOF 或可表示为 unsigned char 的值。直接传负 char（如扩展字符）是未定义行为。"
        },
        {
            question: "`printf(\"%s\", str);` 要求 str？",
            options: ["指向以 '\\0' 结尾的合法内存的指针", "是任意指针", "必须是数组", "长度非零"],
            correct: 0, difficulty: 2,
            explanation: "%s 会一直读到 '\\0'。若指针无效或缺少 '\\0'，会越界读甚至崩溃。必须保证 str 指向有效的以 '\\0' 结尾的字符串。"
        },
        {
            question: "printf 打印 double 用 `%f` 而非 `%lf`，原因是什么？",
            options: ["变参中 float 被提升为 double，%f 与 double 对应，%lf 在 printf 中是多余的", "printf 不支持 double", "%f 对应 int", "必须用 %lf"],
            correct: 0, difficulty: 3,
            explanation: "在变参列表中 float 自动提升为 double，所以 printf 中 %f 已经对应 double；%lf 也是合法的（C99 起）。而在 scanf 中必须用 %lf 对应 double*。"
        },
        {
            question: "`getenv(\"PATH\")` 可能返回？",
            options: ["NULL（环境变量不存在时）", "必定非空", "空字符串而不是 NULL", "编译错误"],
            correct: 0, difficulty: 2,
            explanation: "若环境变量不存在，getenv 返回 NULL。使用返回值前应检查是否为 NULL，否则解引用空指针崩溃。"
        },
        {
            question: "调用 `system()` 函数的主要风险是？",
            options: ["命令注入漏洞和平台可移植性差", "没有风险", "执行更快", "更加安全"],
            correct: 0, difficulty: 2,
            explanation: "system() 把字符串交给 shell 执行，若拼接用户输入存在命令注入风险；且依赖平台 shell，可移植性差。能用库函数就避免使用。"
        }
    ],

    '11': [
        {
            question: "逐行读取文本文件，正确的循环写法是？",
            options: ["`while (fgets(buf, size, fp) != NULL) { ... }`", "`while (!feof(fp)) { ... }`", "`while (fp) { ... }`", "`while (fgetc(fp)) { ... }`"],
            correct: 0, difficulty: 3,
            explanation: "feof 只有在读取操作尝试越过文件末尾后才置位，用它做循环条件会多读一次。正确做法是直接检查读取函数返回值。"
        },
        {
            question: "用 \"r\" 模式 fopen 一个不存在的文件，返回？",
            options: ["NULL", "一个空文件指针", "直接崩溃", "错误码 1"],
            correct: 0, difficulty: 1,
            explanation: "\"r\" 要求文件存在，否则 fopen 返回 NULL。使用前必须检查返回值。"
        },
        {
            question: "fscanf 之后为什么要检查返回值？",
            options: ["判断成功转换的项数是否等于期望值，防止处理无效数据", "没有意义", "为了性能", "让编译器高兴"],
            correct: 0, difficulty: 2,
            explanation: "fscanf 返回成功赋值的项数。若文件格式不符会返回较少项数或 EOF，不检查就使用变量会读到未初始化/陈旧数据。"
        },
        {
            question: "用 fwrite 直接写结构体到文件的问题？",
            options: ["结构体含填充字节且布局随平台而异，跨平台不可移植", "完全没问题", "速度更慢", "更省空间"],
            correct: 0, difficulty: 3,
            explanation: "结构体有对齐填充、各平台对齐规则和字节序不同，直接写二进制结构体在不同编译器/机器间无法互换。应逐字段序列化或按协议打包。"
        },
        {
            question: "文本模式写文件时，Windows 上 `\\n` 会被？",
            options: ["转换成 `\\r\\n` 写入", "原样写入", "忽略", "报错"],
            correct: 0, difficulty: 2,
            explanation: "文本模式下，写 '\\n' 会自动转成 '\\r\\n'，读时反向转换。二进制模式（\"wb\"）不做转换。"
        },
        {
            question: "fseek 的 whence 参数 SEEK_SET 表示？",
            options: ["从文件开头定位", "从文件末尾定位", "从当前位置定位", "由 offset 决定"],
            correct: 0, difficulty: 2,
            explanation: "SEEK_SET（开头）、SEEK_CUR（当前）、SEEK_END（末尾）。fseek(fp, offset, SEEK_SET) 从文件头偏移 offset 字节。"
        },
        {
            question: "`char c = fgetc(fp);` 然后用 c 判断 EOF，有什么问题？",
            options: ["fgetc 返回 int，用 char 存会把 EOF(-1) 与字符 0xFF 混淆", "没有问题", "这样更高效", "编译错误"],
            correct: 0, difficulty: 3,
            explanation: "fgetc 返回 int 以区分 EOF(-1) 与 0~255 的字符。若用 char 存储，有符号 char 会把合法字符 0xFF 也当成 -1（EOF）。必须用 int 接收。"
        },
        {
            question: "fopen 的 \"a+\" 模式表示？",
            options: ["读 + 追加写（文件不存在则创建）", "只读", "只写（截断）", "二进制读"],
            correct: 0, difficulty: 2,
            explanation: "\"a+\" 打开用于读取和追加，文件不存在则创建，写操作总在末尾。\"w+\" 则会截断原文件。"
        },
        {
            question: "文件使用完毕后应该？",
            options: ["调用 fclose(fp) 关闭并释放资源", "调用 free(fp)", "调用 close(fp)", "什么都不用做"],
            correct: 0, difficulty: 1,
            explanation: "FILE* 由 fopen 分配，fclose 释放其占用的系统资源并刷新缓冲。忘记关闭会造成资源泄漏和缓冲丢失。"
        },
        {
            question: "`fputs(s, fp)` 写入文件的内容是？",
            options: ["字符串 s（不含末尾的 '\\0'）", "单个字符", "一个字节", "结构体"],
            correct: 0, difficulty: 1,
            explanation: "fputs 把字符串写入文件但不会写结尾 '\\0'。fputc 写单个字符。"
        },
        {
            question: "fseek 的 offset 类型是 long，要定位超大型文件（>2GB）时可用？",
            options: ["fseeko / ftello（使用 off_t，64 位）", "fflush", "freopen", "fread"],
            correct: 0, difficulty: 3,
            explanation: "long 在 32 位平台只有 4 字节，无法表示大文件偏移。POSIX 提供 fseeko/ftello 用 off_t（可 64 位），或用 fsetpos/fgetpos。"
        },
        {
            question: "`ferror(fp)` 用来检测？",
            options: ["文件流是否发生了错误", "是否到达文件末尾", "文件指针位置", "缓冲区大小"],
            correct: 0, difficulty: 2,
            explanation: "ferror 返回非 0 表示该流上发生过读写错误。feof 检测的是文件末尾。两者常配合 perror 使用。"
        },
        {
            question: "多个 FILE* 同时指向同一文件并写入，会？",
            options: ["结果不确定，需要加锁或串行访问", "自动安全合并", "一定更快", "编译错误"],
            correct: 0, difficulty: 3,
            explanation: "标准不保证对同一文件的并发访问安全，可能交错写入或丢失数据。多线程/多进程写同一文件需自行同步。"
        },
        {
            question: "删除一个文件用哪个函数？",
            options: ["`remove(\"file.txt\")`", "`delete(\"file.txt\")`", "`fclose(\"file.txt\")`", "`unlink()`（POSIX）"],
            correct: 2, difficulty: 1,
            explanation: "标准库用 remove() 删除文件（也可删空目录）。unlink 是 POSIX 系统调用。题目选项中最标准、可移植的是 remove。"
        },
        {
            question: "把可变内容格式化到固定大小的栈缓冲区，隐患是？",
            options: ["缓冲区溢出，应使用 snprintf 限制长度", "没有隐患", "速度慢", "更安全"],
            correct: 0, difficulty: 3,
            explanation: "sprintf 不限制写入长度，内容超出缓冲区就会越界写。安全做法是 snprintf(buf, sizeof buf, ...) 或直接 fprintf 到文件。"
        },
        {
            question: "向文件进行格式化输出，使用？",
            options: ["`fprintf(fp, \"%d\", x);`", "`printf(\"%d\", x);`", "`fputc(x);`", "`sprintf(x);`"],
            correct: 0, difficulty: 1,
            explanation: "fprintf 与 printf 格式相同，只是多一个 FILE* 参数作为输出目标。printf 只输出到 stdout。"
        },
        {
            question: "fopen 之后没有检查返回值就直接 fread/fprintf，会发生？",
            options: ["对 NULL 文件指针操作，崩溃（未定义行为）", "正常", "被忽略", "编译错误"],
            correct: 0, difficulty: 2,
            explanation: "fopen 失败返回 NULL，未检查就直接使用空指针进行 I/O 是未定义行为，典型表现是段错误。"
        },
        {
            question: "`fread(a, sizeof(int), n, fp)` 一次调用会读取？",
            options: ["最多 n 个 int 元素", "n 个字节", "恰好 1 个元素", "1 个字节"],
            correct: 0, difficulty: 2,
            explanation: "fread 的参数是元素大小和元素个数。它返回成功读到的完整元素个数（可能小于 n），应检查返回值判断是否读满。"
        },
        {
            question: "`FILE*` 与文件描述符（file descriptor）的关系是？",
            options: ["FILE* 是标准库带缓冲的封装，fd 是系统调用层", "两者完全相同", "两者无关", "FILE* 更底层"],
            correct: 0, difficulty: 2,
            explanation: "FILE* 在 fd 之上提供缓冲、格式化等功能（由 fopen 返回）；fd 是整数，用于 open/read/write 等系统调用。fileno() 可取得 fd。"
        },
        {
            question: "用 `tmpnam` 生成临时文件名的主要风险是？",
            options: ["文件名可被猜测，存在竞争条件，推荐用 tmpfile", "没有风险", "速度太慢", "文件名不唯一"],
            correct: 0, difficulty: 3,
            explanation: "tmpnam 返回的文件名可能被攻击者预创建（TOCTOU 竞态），且规范建议避免使用。tmpfile 直接创建并自动删除，更安全。"
        }
    ]
};
