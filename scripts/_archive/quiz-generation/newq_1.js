/* ============================================================
 * 新增题库数据（第 1-3 章）— 参考谭浩强《C语言程序设计》
 * 每章 20 道，重点覆盖易混易错点
 * 难度: 1=基础 2=中等 3=困难
 * ============================================================ */
'use strict';

module.exports = {
    '01': [
        {
            question: "C 程序编译后，链接器（linker）的作用是什么？",
            options: ["把各目标文件和库文件合并成可执行文件", "把 C 源码编译成目标文件", "把汇编代码转成机器码", "把源代码翻译成字节码"],
            correct: 0, difficulty: 1,
            explanation: "编译阶段为每个源文件生成目标文件（.o），链接器负责合并它们、解析符号引用，最终生成可执行文件。"
        },
        {
            question: "`printf` 函数的原型声明在哪个头文件中？",
            options: ["<stdio.h>", "<stdlib.h>", "<string.h>", "<math.h>"],
            correct: 0, difficulty: 1,
            explanation: "标准输入输出函数（printf、scanf、fopen 等）都在 <stdio.h> 中声明。"
        },
        {
            question: "C99 标准规定，main 函数没有显式 return 语句时，程序默认返回？",
            options: ["0（表示成功）", "1", "-1", "随机值"],
            correct: 0, difficulty: 2,
            explanation: "C99 起规定：若 main 函数执行到末尾而未遇到 return，等价于 `return 0;`。C89 中这是未定义行为。"
        },
        {
            question: "链接阶段报错 `undefined reference to 'foo'`，最可能的原因是？",
            options: ["调用了 foo 但它的定义从未被链接进来", "foo 这个名字拼写错误但已定义", "foo 是库函数未包含头文件", "foo 定义所在文件有语法错误"],
            correct: 0, difficulty: 2,
            explanation: "undefined reference 发生在链接期：代码引用了一个符号，但所有目标文件/库中都没有它的定义。头文件缺失会报编译错误，不会走到链接期。"
        },
        {
            question: "在头文件中写 `int x = 0;`（非 static、非 extern），若该头文件被多个 .c 文件包含，链接时会？",
            options: ["多重定义（duplicate definition）错误", "正常链接", "只保留一份定义", "取决于链接器"],
            correct: 0, difficulty: 3,
            explanation: "每个包含该头文件的编译单元都会生成一个 x 的全局定义，链接器看到多个相同符号的强定义就报多重定义错误。所以头文件中应写 `extern int x;`，在某个 .c 中定义。"
        },
        {
            question: "C 语言的语法错误通常在哪个阶段被发现？",
            options: ["编译阶段", "预处理阶段", "链接阶段", "运行阶段"],
            correct: 0, difficulty: 1,
            explanation: "语法分析属于编译阶段。预处理阶段只做文本替换（不含语法检查），链接阶段只处理符号。"
        },
        {
            question: "`char c = 128;`（设 char 为有符号 8 位）会发生？",
            options: ["值溢出，行为实现定义，通常变成负数", "编译错误", "正常存储 128", "未定义行为，必定崩溃"],
            correct: 0, difficulty: 2,
            explanation: "有符号 char 范围是 -128~127。把 128 赋给它属于实现定义行为（modern C 中是无符号溢出规则外的实现定义），常见编译器下得到 -128。"
        },
        {
            question: "下列哪个特性是 C99 相对于 C89 新增的？",
            options: ["允许在 for 循环的初始化部分声明变量", "支持结构体", "支持函数", "支持指针"],
            correct: 0, difficulty: 2,
            explanation: "C99 引入了块内声明、`//` 注释、for 内声明变量等。结构体、函数、指针在 C89 就已存在。"
        },
        {
            question: "多个源文件都定义了同名全局函数（都不是 static），链接时会？",
            options: ["报多重定义错误", "最后一个定义生效", "先声明的生效", "正常链接，取其一"],
            correct: 0, difficulty: 2,
            explanation: "全局非 static 函数具有外部链接，多个编译单元中同名定义在链接期会冲突，报 duplicate symbol 错误。"
        },
        {
            question: "main 函数返回 int 类型的意义是什么？",
            options: ["向操作系统报告程序的退出状态", "给 printf 提供返回值", "没有实际意义", "返回程序运行行数"],
            correct: 0, difficulty: 1,
            explanation: "main 的返回值由操作系统接收，0 表示正常结束，非 0 表示异常，常被 shell 脚本检查。"
        },
        {
            question: "以下哪一项是函数声明，而不是函数定义？",
            options: ["int add(int, int);", "int add(int a, int b) { return a + b; }", "int add(int a, int b) { ... }", "以上全是定义"],
            correct: 0, difficulty: 2,
            explanation: "以分号结尾、没有函数体的就是声明（原型）。有花括号函数体的才是定义。"
        },
        {
            question: "`#ifdef _WIN32` 最常见的用途是？",
            options: ["判断当前是否 Windows 平台以便条件编译", "定义一个名为 _WIN32 的常量", "强制包含某个头文件", "取消 _WIN32 宏"],
            correct: 0, difficulty: 1,
            explanation: "`#ifdef _WIN32` 用于平台条件编译：在 Windows 编译器下 _WIN32 会自动定义，据此编写跨平台代码。"
        },
        {
            question: "gcc 编译时加上 `-Wall` 选项的作用是？",
            options: ["开启更多编译警告", "进行代码优化", "链接静态库", "生成调试信息"],
            correct: 0, difficulty: 1,
            explanation: "-Wall 开启一组常用警告，能提前暴露隐式转换、未使用变量等问题，是良好的编译习惯。"
        },
        {
            question: "`/* 外层 /* 内层 */ 剩余代码 */` 这段代码会发生什么？",
            options: ["内层的 `*/` 提前结束注释，剩余的 `*/` 导致语法错误", "注释正确嵌套，整体被注释", "只注释外层，内层生效", "编译正常，无错误"],
            correct: 0, difficulty: 3,
            explanation: "C 的块注释不支持嵌套，遇到第一个 `*/` 就结束。内层 `*/` 之后的内容会参与编译，末尾多余的 `*/` 是语法错误。"
        },
        {
            question: "可执行程序运行后，第一个被执行的 C 函数是？",
            options: ["main（由启动代码 crt0 先运行再调用它）", "程序中定义的第一个函数", "名为 init 的函数", "printf"],
            correct: 0, difficulty: 3,
            explanation: "操作系统先进入启动例程（crt0/startup），完成环境初始化后再调用 main。所以 main 是 C 层面第一个被调用的函数。"
        },
        {
            question: "头文件中声明 `int f(double);`，但某个 .c 里定义成 `int f(int x) { ... }`，会发生？",
            options: ["链接期通常不检查原型一致性，运行时参数解释错误", "编译必然报错", "正常运行无问题", "报重复定义错误"],
            correct: 0, difficulty: 3,
            explanation: "声明与定义分属不同编译单元时，链接器只按符号名匹配、不做类型检查。调用按错误原型解释实参，导致未定义行为。应保证声明与定义一致。"
        },
        {
            question: "C 编译器把 C 源程序翻译成？",
            options: ["目标文件（机器码 + 符号表）", "字节码", "解释执行的脚本", "HTML 页面"],
            correct: 0, difficulty: 1,
            explanation: "编译器把 C 源码编译为包含机器码的目标文件，再由链接器链接成可执行程序。C 是编译型语言。"
        },
        {
            question: "一个可执行程序中能否出现两个 main 函数定义？",
            options: ["不能，会报重复定义错误", "可以", "取决于操作系统", "只有 Windows 不允许"],
            correct: 0, difficulty: 1,
            explanation: "main 是程序入口，只能有一个定义。出现两个 main 在链接期就是重复符号错误。"
        },
        {
            question: "printf 写入 stdout 默认是行缓冲/全缓冲的，下列哪种情况会触发缓冲区刷新？",
            options: ["以上都是：程序正常退出、缓冲区写满、显式调用 fflush", "只有程序崩溃时", "只有调用 fclose 时", "永远不会自动刷新"],
            correct: 0, difficulty: 3,
            explanation: "当 stdout 连接到终端时通常是行缓冲（遇换行刷新），重定向到文件时是全缓冲。程序正常退出、缓冲区满、显式 fflush 都会刷新。"
        },
        {
            question: "C 源程序经过预处理后，生成的内容接着交给哪个阶段？",
            options: ["编译器（编译成汇编/目标代码）", "链接器", "操作系统", "解释器"],
            correct: 0, difficulty: 1,
            explanation: "标准编译流程为：预处理 → 编译 → 汇编 → 链接。预处理的输出仍是 C 代码，交给编译器继续处理。"
        }
    ],

    '02': [
        {
            question: "`int a = 5, b; b = a++ + a++;` 执行后 b 的值是？",
            options: ["未定义行为", "11", "12", "13"],
            correct: 0, difficulty: 3,
            explanation: "同一表达式中在两个序列点之间对 a 修改了两次，属于未定义行为，不同编译器结果可能不同，绝不能依赖。"
        },
        {
            question: "表达式 `*p++` 等价于？",
            options: ["`*(p++)`（先取 *p 的值，再让 p 后移）", "`(*p)++`", "`*p + 1`", "语法错误"],
            correct: 0, difficulty: 3,
            explanation: "后缀 ++ 优先级高于一元 *，所以 `*p++` 解析为 `*(p++)`：先返回 *p，然后 p 自增指向下一元素。而 `(*p)++` 是让指向的元素自增。"
        },
        {
            question: "在 C99 中，`-7 % 3` 的值是？",
            options: ["-1", "1", "2", "未定义行为"],
            correct: 0, difficulty: 3,
            explanation: "C99 规定取模结果的符号与被除数相同：-7 = -2×3 + (-1)，所以余数是 -1。注意这与 Python 的结果不同。"
        },
        {
            question: "`int a = 5 / 2;` a 的值是？",
            options: ["2", "2.5", "3", "编译错误"],
            correct: 0, difficulty: 1,
            explanation: "两个整数相除做整数除法，直接截断小数部分，结果 2。若想得到 2.5 需写成 5.0/2 或 (double)5/2。"
        },
        {
            question: "`a = b = c = 5;` 中赋值运算符的结合方向是？",
            options: ["右结合（从右往左依次赋值）", "左结合", "无结合性", "从左往右"],
            correct: 0, difficulty: 2,
            explanation: "赋值运算符是右结合的，`a = b = c = 5` 相当于 `a = (b = (c = 5))`，先把 5 赋给 c，再赋给 b，最后赋给 a。"
        },
        {
            question: "`int x=1, y=2, z; z = x > y ? x : y;` 执行后 z 的值是？",
            options: ["2", "1", "3", "0"],
            correct: 0, difficulty: 1,
            explanation: "条件表达式 `x>y?x:y`：x>y 为假，取 y 的值，即 2。"
        },
        {
            question: "`sizeof` 运算符的结果类型是？",
            options: ["size_t（无符号整型）", "int", "long", "unsigned char"],
            correct: 0, difficulty: 2,
            explanation: "sizeof 返回 size_t（定义在 stddef.h），是无符号整型。用 %zu 打印，不要误用 %d。"
        },
        {
            question: "`int i = 10; i = i >> 1;` 之后 i 的值是？",
            options: ["5", "4", "10", "20"],
            correct: 0, difficulty: 1,
            explanation: "右移一位相当于整除 2（对正数），10>>1 = 5。"
        },
        {
            question: "`char c; short s;` 在表达式 `c + s` 中，c 和 s 会被提升为哪种类型？",
            options: ["int（整型提升）", "char", "long", "float"],
            correct: 0, difficulty: 3,
            explanation: "C 中 char 和 short 在参与运算前会进行整型提升（integer promotion），统一提升为 int。这是 `printf(\"%d\", c+s)` 能正确打印的原因。"
        },
        {
            question: "在 IEEE 754 浮点数下，`0.1 + 0.2 == 0.3` 的结果是？",
            options: ["假（false）", "真（true）", "编译错误", "取决于编译器，通常为真"],
            correct: 0, difficulty: 2,
            explanation: "0.1 和 0.2 在二进制中无法精确表示，0.1+0.2 实际约等于 0.30000000000000004，不等于 0.3。浮点比较应使用误差范围。"
        },
        {
            question: "`a += b;` 与 `a = a + b;` 最本质的区别是？",
            options: ["复合赋值中 a 只求值一次，且隐含一次到 a 类型的转换", "完全没有区别", "复合赋值优先级更高", "复合赋值不能用于表达式"],
            correct: 0, difficulty: 3,
            explanation: "`a += b` 中 a 只被求值一次（如 `p[i++] += b` 中 i++ 只执行一次），并且结果会转换为 a 的类型。例如 `char c; c += 300;` 会按 char 截断。"
        },
        {
            question: "`!(x < y)` 等价于下面哪个表达式？",
            options: ["x >= y", "x > y", "x <= y", "x != y"],
            correct: 0, difficulty: 1,
            explanation: "x<y 为假即 x>=y。取反后 `!(x<y)` 当且仅当 x>=y 时为真。"
        },
        {
            question: "`int a; a = (1, 2, 3);` 执行后 a 的值是？",
            options: ["3", "1", "2", "语法错误"],
            correct: 0, difficulty: 3,
            explanation: "逗号表达式 `(1,2,3)` 依次求值每个操作数，结果是最后一个表达式的值，即 3。注意赋值号 `=` 的优先级高于逗号，所以必须加括号。"
        },
        {
            question: "`unsigned char c = 250; c = c + 10;` 执行后 c 的值是？",
            options: ["4（无符号溢出按模回绕）", "260", "溢出报错", "未定义行为"],
            correct: 0, difficulty: 3,
            explanation: "无符号整型的溢出是良定义的：按模 2^n 回绕。250+10=260，模 256 得 4。这与有符号溢出（未定义行为）不同。"
        },
        {
            question: "`int a = 0, b = 5; if (a && b++) ...` 这之后 b 的值是？",
            options: ["5（短路求值，b++ 未执行）", "6", "0", "未定义行为"],
            correct: 0, difficulty: 2,
            explanation: "`&&` 左操作数 a 为 0（假），整个表达式已确定为假，右侧 b++ 不再求值，因此 b 保持 5。"
        },
        {
            question: "`int x = 5; const int *p = &x; *p = 10;` 会？",
            options: ["编译错误（p 指向的对象不可修改）", "运行时错误", "x 变为 10", "未定义行为"],
            correct: 0, difficulty: 3,
            explanation: "`const int *p` 表示 p 指向一个 const int，通过 p 修改 *p 会编译报错。注意 x 本身可改，只是不能通过 p 改。"
        },
        {
            question: "`(double)5 / 2` 的结果是？",
            options: ["2.5", "2", "2.0", "编译错误"],
            correct: 0, difficulty: 1,
            explanation: "先把 5 强制转为 double 再除以 2，结果为 2.5。若写成 `(double)(5/2)` 则先整数除法得 2 再转成 2.0。"
        },
        {
            question: "`int x = -1; unsigned y = 1;` 表达式 `x > y` 的结果是？",
            options: ["真（true）", "假（false）", "未定义行为", "编译错误"],
            correct: 0, difficulty: 3,
            explanation: "有符号与无符号比较时，有符号数隐式转为无符号：-1 变成 4294967295（32 位），4294967295 > 1 为真。这是常见的隐藏陷阱。"
        },
        {
            question: "单独成句的 `i++;` 产生的副作用是？",
            options: ["i 增加 1，语句的值是自增前或自增后的值但不被使用", "i 不变", "i 变为 0", "编译错误"],
            correct: 0, difficulty: 1,
            explanation: "`i++;` 作为表达式语句，其副作用是让 i 加 1。单独使用时前后缀效果一样，只有返回值不同。"
        },
        {
            question: "`int i = 010;` 执行后 i 的值是？",
            options: ["8（八进制）", "10", "编译错误", "二进制 010 = 2"],
            correct: 0, difficulty: 2,
            explanation: "以 0 开头的整型常量是八进制，010 = 1×8 + 0 = 8。写数字时前导 0 极易造成误解，是经典陷阱。"
        }
    ],

    '03': [
        {
            question: "switch 语句中，case 标签的值必须满足什么条件？",
            options: ["是整型常量表达式", "可以是任意变量", "可以是浮点常量", "可以是字符串"],
            correct: 0, difficulty: 2,
            explanation: "case 标签必须是编译期可求值的整型常量表达式（可以是枚举值或字符常量），不能是变量。"
        },
        {
            question: "以下哪种循环结构至少会执行一次循环体？",
            options: ["do-while", "while", "for", "以上都不是"],
            correct: 0, difficulty: 1,
            explanation: "do-while 先执行循环体再判断条件，所以至少执行一次；while 和 for 先判断，可能一次都不执行。"
        },
        {
            question: "break 语句能跳出？",
            options: ["所在的最内层循环或 switch", "所有外层循环", "整个函数", "整个程序"],
            correct: 0, difficulty: 1,
            explanation: "break 只终止包含它的最内层循环或 switch，不能跳出多层嵌套。"
        },
        {
            question: "`for(i=0;i<3;i++){ if(i==1) continue; printf(\"%d\",i); }` 中执行 continue 之后会？",
            options: ["先执行 for 的更新表达式 i++，再进入下一次条件判断", "立即退出循环", "执行循环体剩余语句", "什么都不做，循环卡住"],
            correct: 0, difficulty: 3,
            explanation: "continue 在 for 循环中会跳到更新表达式（i++），然后才判断条件。初学者常误以为 continue 会直接跳到条件判断。"
        },
        {
            question: "悬空 else（dangling else）与哪个 if 配对？",
            options: ["与最近的、尚未配对的 if 配对", "与最外层的 if 配对", "与第一个 if 配对", "由编译器选项决定"],
            correct: 0, difficulty: 2,
            explanation: "C 规定 else 与最近的未配对 if 结合。因此嵌套 if-else 时应加花括号明确意图。"
        },
        {
            question: "`if (a = b)` 当 b 的值为 0 时，条件的结果是？",
            options: ["假（赋值表达式值为 0）", "真", "编译错误", "未定义行为"],
            correct: 0, difficulty: 2,
            explanation: "`a = b` 是赋值表达式，其值等于 b 被赋的值。b=0 时条件为假。这是 `=` 与 `==` 混淆的经典陷阱。"
        },
        {
            question: "`for(;;)` 是一个？",
            options: ["无限循环", "只执行一次的循环", "不执行的循环", "语法错误"],
            correct: 0, difficulty: 1,
            explanation: "for 的三个表达式都可省略，省略条件时默认为真，形成无限循环。常用 `for(;;)` 或 `while(1)`。"
        },
        {
            question: "switch 语句中 default 子句可以放在？",
            options: ["任意位置（通常放最后）", "只能放在最后", "只能放在最前", "不能使用 default"],
            correct: 0, difficulty: 1,
            explanation: "default 的位置不影响匹配逻辑，习惯放最后。但无论放哪，未匹配 case 都会进入 default。"
        },
        {
            question: "宏中常写 `do { ... } while(0)` 包装多条语句，其目的是？",
            options: ["让宏能安全地包含多条语句并在调用处正常加分号", "制造一个无限循环", "提高运行速度", "减少宏展开体积"],
            correct: 0, difficulty: 2,
            explanation: "`do{...}while(0)` 只执行一次，但它把多条语句包成一个整体，避免宏在 if/else 中只绑定第一条语句的问题，且调用处加分号合法。"
        },
        {
            question: "`if (x)` 当 x 为非零值时会？",
            options: ["执行 if 分支", "执行 else 分支", "编译错误", "取决于 x 的类型"],
            correct: 0, difficulty: 1,
            explanation: "C 的条件判断以非 0 为真。x 非零即真，执行 if 分支。"
        },
        {
            question: "switch 的表达式可以是什么类型？",
            options: ["char（会提升为 int）", "float", "double", "字符串"],
            correct: 0, difficulty: 2,
            explanation: "switch 表达式必须是整型或枚举类型。char 在 C 中属于整型类别，会提升为 int 参与匹配。浮点型和字符串都不合法。"
        },
        {
            question: "两层嵌套循环中，内层的 break 会？",
            options: ["只跳出内层循环", "同时跳出内、外层循环", "跳到外层循环的下一条语句", "产生编译错误"],
            correct: 0, difficulty: 2,
            explanation: "break 只作用于最内层。要从多重循环一次性跳出，需用标志变量或 goto。"
        },
        {
            question: "`while(i < n)` 中若 i 从 0 开始每次自增，循环体会执行 n 次；若 i 从 1 开始，则执行？",
            options: ["n-1 次", "n 次", "n+1 次", "无限循环"],
            correct: 0, difficulty: 2,
            explanation: "i 从 1 到 n-1，共 n-1 个值满足 i<n，因此循环体执行 n-1 次。边界条件是最常出错的点。"
        },
        {
            question: "在循环体内修改循环变量 i 的值，会？",
            options: ["可能导致死循环或跳过部分迭代，行为由逻辑决定", "必然导致死循环", "必然编译错误", "对循环无任何影响"],
            correct: 0, difficulty: 3,
            explanation: "循环变量由自己维护时修改它必须格外小心。例如 `for(i=0;i<10;i++){ i++; }` 实际只迭代 5 次。这不是语法错误，而是逻辑陷阱。"
        },
        {
            question: "case 标签后面可以写多条语句吗？",
            options: ["可以，无需花括号", "不可以，只能一条语句", "必须用花括号包裹", "最多两条语句"],
            correct: 0, difficulty: 2,
            explanation: "case 只是入口标签，其后的语句可以是任意多条，不需要花括号。若希望局部变量作用域隔离，则用花括号包裹。"
        },
        {
            question: "`if (scanf(\"%d\", &n) == 1)` 这种写法的含义是？",
            options: ["只有成功读取到 1 个整数才进入分支", "条件永远为真", "条件永远为假", "语法错误"],
            correct: 0, difficulty: 2,
            explanation: "scanf 返回成功读取并赋值的项数。检查返回值是防御式编程的基本做法，可避免处理无效输入。"
        },
        {
            question: "switch 表达式为 int 时，case 常量可以写成？",
            options: ["整型常量或字符常量（如 1、'a'）", "变量", "浮点常量", "含变量的表达式"],
            correct: 0, difficulty: 1,
            explanation: "字符常量 'a' 本质是整型常量（ASCII 码），可作为 case 标签；变量和浮点常量都不合法。"
        },
        {
            question: "在 switch 的 case 之间（无花括号）直接声明变量，会发生什么？",
            options: ["可声明，但可能被跳过失初始化，读取其值属未定义行为", "编译必然失败", "正常且安全", "运行时必定崩溃"],
            correct: 0, difficulty: 3,
            explanation: "C 允许在 case 后声明变量，但声明可能被 goto 式的跳转跳过，导致使用未初始化的变量。最佳实践是用 `case N: { ... }` 包裹声明。"
        },
        {
            question: "`for(i=0, j=10; i<j; i++, j--);` 执行结束后 i 与 j 的关系是？",
            options: ["i >= j（此处 i==j==5）", "i < j", "i == j-1", "无法确定"],
            correct: 0, difficulty: 2,
            explanation: "i 从 0 增大、j 从 10 减小。当 i=5、j=5 时 `5<5` 为假循环结束，因此结束时 i==j==5。"
        },
        {
            question: "要从多层嵌套循环中一次性跳出，推荐的做法是？",
            options: ["用 goto 或标志变量", "使用 break", "使用 continue", "使用 return"],
            correct: 0, difficulty: 3,
            explanation: "break 只能跳出一层。需要跳出多层时，可用 `goto out;`（跳转前先释放资源）或用标志变量逐层判断。"
        }
    ]
};
