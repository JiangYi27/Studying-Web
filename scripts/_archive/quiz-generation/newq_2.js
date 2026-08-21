/* ============================================================
 * 新增题库数据（第 4-7 章）— 参考谭浩强《C语言程序设计》
 * 每章 20 道，重点覆盖易混易错点
 * 难度: 1=基础 2=中等 3=困难
 * ============================================================ */
'use strict';

module.exports = {
    '04': [
        {
            question: "`int a[10]; void f(int a[]) { ... }` 在 f 内部执行 `sizeof(a)` 得到的是？",
            options: ["指针的大小（如 4 或 8）", "40", "10", "编译错误"],
            correct: 0, difficulty: 3,
            explanation: "数组作为函数参数会退化为指针，函数内 sizeof(a) 是指针大小，而不是数组大小。要获取长度必须额外传入长度参数。"
        },
        {
            question: "`char *p = \"hi\"; p[0] = 'H';` 会发生什么？",
            options: ["未定义行为（字符串字面量通常位于只读区，会段错误）", "正常运行并修改成功", "编译错误", "只产生警告"],
            correct: 0, difficulty: 2,
            explanation: "字符串字面量位于只读存储区，修改它属于未定义行为，通常表现为段错误。若想可修改，应定义 `char p[] = \"hi\";`。"
        },
        {
            question: "`strcpy(dst, src)` 的主要危险在于？",
            options: ["dst 空间不足时会发生缓冲区越界写", "函数执行速度慢", "无法复制字符串", "必须传入指向指针的指针"],
            correct: 0, difficulty: 2,
            explanation: "strcpy 不检查目标空间，若 src 比 dst 长就会越界写，破坏相邻内存，可能被利用为安全漏洞。应改用 strncpy 或 snprintf。"
        },
        {
            question: "`char s[10] = \"hello\";` 那么 `sizeof(s)` 的值是？",
            options: ["10", "6", "5", "4"],
            correct: 0, difficulty: 1,
            explanation: "sizeof 返回数组实际占用的字节数，即声明的大小 10，而不是字符串长度。这是 sizeof 与 strlen 的重要区别。"
        },
        {
            question: "`int a[2][3];` 在内存中的布局是？",
            options: ["12 个 int 连续存放（行优先）", "6 个 int", "各元素不连续", "按列优先存储"],
            correct: 0, difficulty: 2,
            explanation: "二维数组按行优先连续存储：先存第 0 行的 3 个元素，再存第 1 行，共 6 个 int 连续排列。"
        },
        {
            question: "对于二维数组 `int a[3][4]`，`a[i][j]` 与下面哪个等价？",
            options: ["`*(*(a+i)+j)` 和 `*(a[i]+j)` 都等价", "仅 `*(*(a+i)+j)` 等价", "仅 `*(a+i)[j]` 等价", "三者都不等价"],
            correct: 0, difficulty: 3,
            explanation: "a[i] 等价于 *(a+i)，所以 a[i][j] = *(a[i]+j) = *(*(a+i)+j)。而 `*(a+i)[j]` 解析为 *(a+i+j) 是指向行的指针，不是元素。"
        },
        {
            question: "`int a[5]; a[5] = 100;` 会发生什么？",
            options: ["越界写，属于未定义行为", "正常写入第 5 个元素", "编译错误", "必定立即崩溃"],
            correct: 0, difficulty: 3,
            explanation: "a[5] 已超出数组范围（下标 0~4），越界写是未定义行为。C 不检查下标越界，可能悄悄破坏相邻内存，也可能崩溃。"
        },
        {
            question: "`strlen(\"abc\")` 的返回值是？",
            options: ["3", "4", "5", "编译错误"],
            correct: 0, difficulty: 1,
            explanation: "strlen 返回字符串长度，不包括末尾的 '\\0'，因此是 3。而 sizeof(\"abc\") 是 4。"
        },
        {
            question: "`char *p[] = {\"ab\", \"cd\"};` 中 p 是什么？",
            options: ["指针数组（每个元素是 char*）", "指向数组的指针", "char 的二维数组", "一个字符串"],
            correct: 0, difficulty: 3,
            explanation: "[] 优先级高于 *，所以 p 先构成数组，元素类型是 char*。p 是指针数组，可退化为 char**。区分它和 `char (*p)[N]`。"
        },
        {
            question: "`int *p[3]` 与 `int (*p)[3]` 分别表示？",
            options: ["指针数组（3 个 int*）与 数组指针（指向含 3 个 int 的数组）", "都是数组", "都是指针", "前者是函数指针"],
            correct: 0, difficulty: 3,
            explanation: "`int *p[3]`：[] 先与 p 结合，p 是含 3 个 int* 的数组。`int (*p)[3]`：括号使 * 先与 p 结合，p 是指向含 3 个 int 的数组的指针。"
        },
        {
            question: "`char dst[5]; strncpy(dst, \"abcdef\", 5);` 之后 dst 是？",
            options: ["没有 '\\0' 结尾，若用 printf(\"%s\",dst) 会越界读", "正确的字符串 \"abcd\"", "正确的字符串 \"abcde\"", "编译错误"],
            correct: 0, difficulty: 3,
            explanation: "strncpy 只复制最多 n 个字符，源串长度大于等于 n 时不会补 '\\0'。这里是经典陷阱：应复制 n-1 个字符并手动补 '\\0'。"
        },
        {
            question: "`scanf(\"%s\", s);` 当输入 \"hello world\" 时，s 得到？",
            options: ["\"hello\"（%s 遇到空白字符就停止）", "\"hello world\"", "空串", "读取失败"],
            correct: 0, difficulty: 2,
            explanation: "%s 以空白字符（空格、制表、换行）作为分隔符，因此只读入 \"hello\"。要读含空格的整行应使用 fgets。"
        },
        {
            question: "`void f(int a[])` 与 `void f(int *a)` 是否等价？",
            options: ["完全等价", "不等价", "语法不同但含义相同", "前者更高效"],
            correct: 0, difficulty: 2,
            explanation: "在函数参数列表中，`int a[]` 会退化为 `int *a`，两者完全等价。这是 C 中数组参数传递的本质。"
        },
        {
            question: "`char a[20] = \"hi\"; strcat(a, \"world\");` 之后 `strlen(a)` 是？",
            options: ["7", "5", "6", "越界错误"],
            correct: 0, difficulty: 2,
            explanation: "\"hi\" 长 2，\"world\" 长 5，拼接后字符串长度为 7。前提是 a 有足够空间容纳拼接结果。"
        },
        {
            question: "`sizeof(\"abc\")` 的值是？",
            options: ["4", "3", "5", "编译错误"],
            correct: 0, difficulty: 1,
            explanation: "字符串字面量 \"abc\" 是含 4 个 char 的数组（包含末尾 '\\0'），因此 sizeof 为 4。"
        },
        {
            question: "`int a[] = {1, 2, 3};` 中数组 a 的大小是？",
            options: ["由初始化列表自动推断为 3 个元素", "不确定", "10", "编译错误"],
            correct: 0, difficulty: 1,
            explanation: "省略数组长度时，编译器根据初始化列表的元素个数自动确定大小，这里为 3 个 int。"
        },
        {
            question: "`if (strcmp(s1, s2))` 在什么情况下为真？",
            options: ["两字符串不相等时（返回非 0）", "两字符串相等时", "永远为假", "编译错误"],
            correct: 0, difficulty: 3,
            explanation: "strcmp 返回 0 表示相等，非 0 表示不等。所以 `strcmp(s1,s2)` 为真表示两串不相等。初学者常误以为返回真表示相等。"
        },
        {
            question: "`char s[3] = {'a', 'b', 'c'};` 执行 `strlen(s)` 结果是？",
            options: ["无法预测（s 没有 '\\0' 结尾）", "3", "0", "编译错误"],
            correct: 0, difficulty: 2,
            explanation: "s 用单个字符初始化，不含 '\\0'。strlen 会继续向后扫描直到找到 '\\0'，结果是不可预测的，还可能越界读。"
        },
        {
            question: "`int a[3][4];` 中共有多少个元素？",
            options: ["12", "7", "34", "4"],
            correct: 0, difficulty: 1,
            explanation: "3 行 × 4 列 = 12 个 int 元素。"
        },
        {
            question: "向数组越界写入数据最可能的后果是？",
            options: ["破坏相邻内存数据，行为未定义", "一定会立即崩溃", "一定被忽略", "编译阶段报错"],
            correct: 0, difficulty: 3,
            explanation: "C 不提供越界检查，越界写是未定义行为：可能覆盖相邻变量、破坏栈、损坏堆元数据，也可能碰巧没崩，是最危险的错误之一。"
        }
    ],

    '05': [
        {
            question: "函数内的 static 局部变量，其初始化与生命周期的特点是？",
            options: ["只初始化一次，生命周期延续到程序结束", "每次调用都会重新初始化", "不进行初始化", "编译错误"],
            correct: 0, difficulty: 2,
            explanation: "static 局部变量存储在静态区，只在第一次执行到声明处初始化一次，之后每次调用保留上一次的值，直到程序结束才销毁。"
        },
        {
            question: "`f(i++, i++);` 两个实参的求值顺序是？",
            options: ["未指定/未定义，不应写出这种代码", "严格从左到右", "严格从右到左", "按参数个数决定"],
            correct: 0, difficulty: 3,
            explanation: "函数实参的求值顺序是未指定的，且这里 i 在相邻的序列点之间被修改多次，属于未定义行为。结果不可依赖。"
        },
        {
            question: "要用一个函数交换两个 int 变量的值，正确做法是？",
            options: ["传指针：`void swap(int *a, int *b)` 并调用 `swap(&x, &y)`", "直接传值", "用 return 一次返回两个值", "使用全局变量"],
            correct: 0, difficulty: 2,
            explanation: "C 是值传递，直接传 int 只是复制副本，改形参不影响实参。必须传地址，通过指针解引用修改实参。"
        },
        {
            question: "函数返回局部数组名（`return arr;`），调用方使用返回的指针？",
            options: ["是悬空指针，未定义行为", "正常运行", "编译器自动拷贝数组", "只产生警告但安全"],
            correct: 0, difficulty: 2,
            explanation: "局部数组在函数返回后生命周期结束，其内存失效。返回它的地址就成了悬空指针。应改为 static 数组或动态分配。"
        },
        {
            question: "递归求 n! 比循环版本慢，主要原因是？",
            options: ["每次递归调用都有函数调用与栈帧建立的开销", "数学计算结果不同", "代码更长", "无法被编译器优化"],
            correct: 0, difficulty: 3,
            explanation: "递归每层调用都要建立栈帧、保存现场、传递参数，开销比循环大。深度过深还会栈溢出。"
        },
        {
            question: "`extern int g;` 写在某个 .c 文件（非定义处）的作用是？",
            options: ["声明 g 在别处定义，本文件可以使用它", "在这里定义 g", "初始化 g 为 0", "复制一份 g"],
            correct: 0, difficulty: 2,
            explanation: "extern 只是声明：告诉编译器 g 在其他编译单元定义，不分配存储。真正的定义（如 `int g = 0;`）只能出现一次。"
        },
        {
            question: "函数原型 `int f(int);` 的作用是？",
            options: ["告诉编译器 f 的返回值和参数类型，便于编译期类型检查", "定义函数 f", "调用函数 f", "为 f 分配存储"],
            correct: 0, difficulty: 1,
            explanation: "函数原型（声明）向编译器提供函数的签名信息，使调用处能做参数个数和类型检查，避免隐式声明。"
        },
        {
            question: "可变参数函数中写 `va_arg(ap, char)` 会？",
            options: ["出错：char 会被提升为 int，应使用 int 读取", "正常工作", "返回 0", "产生编译错误"],
            correct: 0, difficulty: 3,
            explanation: "变参中 char、short 会默认整型提升为 int，float 提升为 double。va_arg 必须使用提升后的类型，否则行为未定义。"
        },
        {
            question: "用 static 修饰函数后，该函数？",
            options: ["仅在其所在的源文件内可见（内部链接）", "在整个程序可见", "不能被调用", "会自动内联"],
            correct: 0, difficulty: 1,
            explanation: "static 函数具有内部链接，只在定义它的编译单元内可见，可避免与其他文件同名函数冲突，也防止被外部调用。"
        },
        {
            question: "`void f(const char *s)`，调用时传入字符串字面量 `f(\"hello\");` 是否合法？",
            options: ["合法，字符串字面量可传给 const char*", "不合法", "需要强转", "会有警告但禁止"],
            correct: 0, difficulty: 2,
            explanation: "字符串字面量的类型是 char 数组（可转换为 const char*），传给 const char* 参数完全合法，也推荐这样做以表达『不修改』的意图。"
        },
        {
            question: "递归调用过深会导致什么？",
            options: ["栈溢出", "堆溢出", "死循环", "编译错误"],
            correct: 0, difficulty: 1,
            explanation: "每层递归占用一块栈帧，深度过大会耗尽栈空间导致栈溢出（Stack Overflow），程序崩溃。"
        },
        {
            question: "把函数指针作为参数传递（回调机制）的典型例子是？",
            options: ["qsort 的比较函数参数", "减少代码体积", "循环优化", "动态内存分配"],
            correct: 0, difficulty: 3,
            explanation: "qsort 接受一个比较函数指针作为回调，由库调用用户的比较逻辑。这是函数指针最常见的用途之一。"
        },
        {
            question: "main 函数返回非 0 值表示？",
            options: ["程序以异常/失败状态结束", "程序正常结束", "无任何意义", "编译器会报错"],
            correct: 0, difficulty: 1,
            explanation: "main 的返回值传递给操作系统，0 表示成功，非 0 表示失败或错误码，shell 可用 `echo $?` 查看。"
        },
        {
            question: "局部变量与全局变量同名时，在函数内部访问该名字会？",
            options: ["使用局部变量（局部遮蔽全局）", "使用全局变量", "编译错误", "两者合并"],
            correct: 0, difficulty: 1,
            explanation: "内层作用域的变量会遮蔽外层同名变量。函数内访问的是局部变量；要访问全局变量需用 `::`（C++）或改名。"
        },
        {
            question: "`int f(int a[10])` 中的形参 a 实际上是？",
            options: ["指针 int*，数组长度 10 会被忽略", "int[10] 数组", "int**", "编译错误"],
            correct: 0, difficulty: 2,
            explanation: "数组参数会退化为指针，`int a[10]` 与 `int a[]`、`int *a` 完全等价，方括号里的 10 只是文档性说明，被编译器忽略。"
        },
        {
            question: "未显式初始化的全局变量，其默认值是？",
            options: ["0", "随机值", "垃圾值", "编译错误"],
            correct: 0, difficulty: 1,
            explanation: "全局变量（静态存储期）未初始化时自动清零。只有局部（自动）变量才是不确定的随机值。"
        },
        {
            question: "函数内 static 局部变量，把它的地址返回给调用方，是否安全？",
            options: ["安全（static 变量生命周期到程序结束）", "是悬空指针", "编译错误", "运行必定崩溃"],
            correct: 0, difficulty: 3,
            explanation: "static 局部变量存活于整个程序生命周期，返回其地址是安全的，不会悬空。但注意所有调用共享同一份数据。"
        },
        {
            question: "值传递中，函数内修改形参会影响实参吗？",
            options: ["不会，形参是实参的副本", "会影响", "取决于参数类型", "编译错误"],
            correct: 0, difficulty: 1,
            explanation: "C 函数参数一律值传递，形参是实参的拷贝，修改形参不影响实参。要修改实参必须传指针。"
        },
        {
            question: "`int f(void){ static int n = 0; n++; return n; }` 连续调用 3 次，返回值依次是？",
            options: ["1, 2, 3", "0, 1, 2", "1, 1, 1", "编译错误"],
            correct: 0, difficulty: 2,
            explanation: "static 局部变量只在第一次调用时初始化为 0，之后保留上次的值并递增，因此三次调用返回 1、2、3。"
        },
        {
            question: "函数声明中省略形参名，如 `int f(int, int);` 是否合法？",
            options: ["合法，声明只需要类型", "不合法", "合法但必须给出名字", "需要编译器选项支持"],
            correct: 0, difficulty: 1,
            explanation: "函数原型（声明）只需类型，形参名可省略。只有在定义函数时才需要给出形参名。"
        }
    ],

    '06': [
        {
            question: "`int *p, q;` 中 q 的类型是？",
            options: ["int（不是指针）", "int*", "int**", "编译错误"],
            correct: 0, difficulty: 3,
            explanation: "`*` 只作用于紧邻的标识符 p，因此 p 是 int*，而 q 是普通 int。若想声明两个指针应写 `int *p, *q;`。"
        },
        {
            question: "对于指针 p，`p[i]` 等价于？",
            options: ["`*(p + i)`", "`&p[i]`", "`p + i`", "`*p + i`"],
            correct: 0, difficulty: 2,
            explanation: "下标运算的本质就是指针解引用：p[i] 严格等价于 *(p+i)。这也是数组下标和指针运算统一的根本。"
        },
        {
            question: "`int a[5];` 表达式 `&a` 的类型是？",
            options: ["`int (*)[5]`，指向含 5 个 int 的数组的指针", "`int*`", "`int[5]`", "`int**`"],
            correct: 0, difficulty: 3,
            explanation: "`a` 退化为 int*（首元素地址），而 `&a` 是整个数组的地址，类型为 int(*)[5]。两者数值相同但类型不同，`&a + 1` 会跳过整个数组。"
        },
        {
            question: "解引用一个未初始化的指针（`*p = 10;`）？",
            options: ["未定义行为（野指针），通常崩溃", "安全返回 0", "编译错误", "自动指向合法内存"],
            correct: 0, difficulty: 2,
            explanation: "未初始化指针值是随机的，指向的地址不可知。对它解引用是未定义行为，是段错误的常见来源。"
        },
        {
            question: "对指针而言，下列哪种运算是合法的？",
            options: ["加/减整数、两个指针相减、指针比较", "指针相乘", "指针与浮点数混合运算", "指针取模"],
            correct: 0, difficulty: 1,
            explanation: "指针只支持与整数的加减（移动元素）、同类指针相减（得到元素个数）、指针比较等，不支持乘除等算术。"
        },
        {
            question: "`void*` 指针在使用前需要？",
            options: ["先强转为具体类型指针再进行解引用或算术", "直接解引用", "不能用于任何场合", "先赋值给 int"],
            correct: 0, difficulty: 2,
            explanation: "void* 是通用指针，不能直接解引用也不能做算术运算（缺少目标类型）。使用前需强转为具体类型，如 `(int*)p`。"
        },
        {
            question: "`int **p` 最常见的用途是？",
            options: ["在函数中修改调用者的指针变量", "表示二维数组", "函数指针", "数组指针"],
            correct: 0, difficulty: 2,
            explanation: "二级指针用于『指针的指针』，典型场景是函数内需要修改传入的指针本身（如 `void alloc(int **p){ *p = malloc(...); }`）。"
        },
        {
            question: "已知 `int (*fp)(int);` 是函数指针，调用它 `fp(5)` 与 `(*fp)(5)`？",
            options: ["两者等价", "只有 fp(5) 合法", "只有 (*fp)(5) 合法", "两者都错"],
            correct: 0, difficulty: 2,
            explanation: "C 标准允许函数指针直接当函数调用，`fp(5)` 与 `(*fp)(5)` 完全等价。两种写法都合法。"
        },
        {
            question: "`void f(int *p){ *p = 10; }` 要在调用处修改 int 变量 x，应该写成？",
            options: ["`f(&x)`", "`f(x)`", "`f(*x)`", "`f(10)`"],
            correct: 0, difficulty: 1,
            explanation: "函数内通过解引用 p 修改的是 p 指向的内存，因此调用时必须传入 x 的地址 `&x`。"
        },
        {
            question: "`int *p = malloc(4); free(p); *p = 1;` 会发生什么？",
            options: ["悬空指针解引用，未定义行为", "正常执行", "编译错误", "内存泄漏"],
            correct: 0, difficulty: 2,
            explanation: "free 后 p 成为悬空指针（指向已释放的内存）。再解引用是未定义行为。最佳实践是 free 后置 NULL：`free(p); p = NULL;`。"
        },
        {
            question: "main 函数的 argv 参数类型是？",
            options: ["`char **`（指向参数字符串数组的指针）", "`char*`", "`int**`", "`char[10][10]`"],
            correct: 0, difficulty: 3,
            explanation: "argv 等价于 `char *argv[]`，即一个 char* 数组，数组名退化为 char**。argv[0] 通常是程序名。"
        },
        {
            question: "`int *p = NULL;` 这里的 NULL 通常是？",
            options: ["空指针常量（标准上 `(void*)0` 或 0）", "地址 0 上的一块合法内存", "字符串", "编译错误"],
            correct: 0, difficulty: 2,
            explanation: "NULL 是空指针常量，通常定义为 `((void*)0)`。判断指针是否为空用 `p == NULL`，但解引用空指针是未定义行为。"
        },
        {
            question: "`int (*p)[4]; p = a;` 这里的 a 应当是什么？",
            options: ["行数为若干、列数为 4 的二维数组名，如 `int a[3][4]`", "一维数组 `int a[4]`", "`int* a`", "`int** a`"],
            correct: 0, difficulty: 3,
            explanation: "p 是指向含 4 个 int 的数组的指针（数组指针/行指针）。`p = a` 要求 a 的每一行都是含 4 个 int 的数组，即 `int a[N][4]`。"
        },
        {
            question: "同一数组内 `p2 - p1` 的结果类型和含义是？",
            options: ["ptrdiff_t，表示两指针间相隔的元素个数", "表示字节数差", "是地址差值", "无意义"],
            correct: 0, difficulty: 2,
            explanation: "两个指向同一数组元素的指针相减，结果是它们之间元素的个数，类型为 ptrdiff_t（有符号）。"
        },
        {
            question: "多级指针 `int ***p` 表示？",
            options: ["指向 int** 的指针，即指针的指针的指针", "三维数组", "函数指针", "非法声明"],
            correct: 0, difficulty: 1,
            explanation: "`int ***p`：p 是指向 int** 的指针。解引用三次才能得到 int 值。多级指针常用于指针数组参数传递。"
        },
        {
            question: "`int (*fp[3])(int);` 声明的是什么？",
            options: ["含 3 个函数指针的数组", "指向数组的指针", "返回指针的函数", "普通 int 数组"],
            correct: 0, difficulty: 3,
            explanation: "`fp[3]` 先构成数组，元素类型是 `int (*)(int)`，即指向『接收 int 返回 int 的函数』的指针。这是函数指针数组，常用于分派表。"
        },
        {
            question: "`for (p = s; *p; p++);` 遍历字符串后，循环结束时 p 指向？",
            options: ["字符串末尾的 '\\0' 处", "字符串开头", "字符串外越界", "未定义位置"],
            correct: 0, difficulty: 2,
            explanation: "循环在 *p == '\\0'（值为 0）时退出，此时 p 正好指向字符串末尾的 '\\0' 字符。"
        },
        {
            question: "下面哪个指针属于野指针？",
            options: ["释放后未置 NULL 的指针", "值为 NULL 的指针", "指向全局变量的指针", "指向函数内静态变量的指针"],
            correct: 0, difficulty: 1,
            explanation: "野指针指向未知/无效的内存。free 后未置 NULL 的指针、未初始化的指针都是野指针。NULL 指针与它们不同。"
        },
        {
            question: "`char *p = \"hi\"; p = \"hello\";` 是否合法？",
            options: ["合法，p 本身可以改变指向", "不合法", "会段错误", "会造成内存泄漏"],
            correct: 0, difficulty: 3,
            explanation: "字符串字面量只读，但指针 p 本身是变量，可以重新指向其他字符串字面量。要分清『p 指向的内容』与『p 本身』。"
        },
        {
            question: "要把整数表示的地址转换为指针，最可移植的做法是用什么类型？",
            options: ["`intptr_t` / `uintptr_t`", "int", "long", "unsigned"],
            correct: 0, difficulty: 3,
            explanation: "`intptr_t`/`uintptr_t`（定义于 <stdint.h>）是保证能容纳任何指针的整数类型，可安全地在整数与指针间转换。用 int 或 long 都不保证宽度足够。"
        }
    ],

    '07': [
        {
            question: "malloc 返回 NULL 通常表示？",
            options: ["内存分配失败", "成功分配了 0 字节", "一切正常", "返回值被截断"],
            correct: 0, difficulty: 1,
            explanation: "malloc 失败时返回 NULL。严谨的程序应在使用前检查返回值是否为 NULL，避免解引用空指针。"
        },
        {
            question: "`free(p);` 之后立即 `p = NULL;` 的目的是？",
            options: ["避免 p 成为悬空指针，防止二次 free 出错", "立即归还内存给系统", "提高程序速度", "这是编译器强制要求的"],
            correct: 0, difficulty: 2,
            explanation: "free 后 p 仍保存原地址，再次 free 或解引用会出错。置 NULL 后，再次 free(NULL) 是安全的（空操作），也便于判断。"
        },
        {
            question: "`int *p = malloc(10); int *q = realloc(p, 100);` 若 realloc 失败返回 NULL，此时？",
            options: ["p 仍然有效，需要手动 free(p)", "p 已被释放", "q 指向原来的 p", "必须 free(q)"],
            correct: 0, difficulty: 3,
            explanation: "realloc 失败时返回 NULL，且原内存块保持不变、仍有效。若直接 `p = realloc(...)` 而不检查返回值，会丢失原指针造成泄漏。"
        },
        {
            question: "`calloc(n, size)` 与 `malloc(n*size)` 的区别是？",
            options: ["calloc 会把分配的内存初始化为 0", "malloc 会清零", "calloc 不分配内存", "两者完全相同"],
            correct: 0, difficulty: 1,
            explanation: "calloc 分配并清零，适合数组。malloc 不初始化，内容不确定。另外 calloc 内部会做溢出检查（n*size 相乘溢出）。"
        },
        {
            question: "检测内存泄漏的常用工具是？",
            options: ["valgrind", "gdb", "gcc", "make"],
            correct: 0, difficulty: 1,
            explanation: "valgrind 的 memcheck 工具能报告泄漏、越界、未初始化读等内存问题。gdb 是调试器，gcc 是编译器。"
        },
        {
            question: "与堆上分配相比，栈上分配内存的特点是？",
            options: ["速度快（不需管理、自动释放）", "速度慢", "速度相同", "无法比较"],
            correct: 0, difficulty: 2,
            explanation: "栈分配只需移动栈指针，且函数返回自动回收，无碎片问题，比堆分配快得多。堆分配需要查找空闲块、可能涉及系统调用。"
        },
        {
            question: "malloc 分配的内存起始地址通常？",
            options: ["对齐到最大的基本对齐要求（常为 8 或 16 字节）", "任意地址", "总是 1 字节对齐", "随机且不保证可用"],
            correct: 0, difficulty: 2,
            explanation: "标准保证 malloc 返回的指针满足所有基本类型的对齐要求，因此可以直接强转为任何类型指针使用。"
        },
        {
            question: "对同一个指针连续调用两次 free？",
            options: ["未定义行为（double free），通常崩溃或破坏堆", "完全安全", "被忽略", "编译错误"],
            correct: 0, difficulty: 1,
            explanation: "重复释放同一块内存是未定义行为，是常见崩溃原因。应遵循『free 后置 NULL』的习惯来避免。"
        },
        {
            question: "悬空指针（dangling pointer）是指？",
            options: ["指向已释放内存的指针", "从未初始化的指针", "值为 NULL 的指针", "指向字符串常量的指针"],
            correct: 0, difficulty: 2,
            explanation: "悬空指针是『曾指向合法对象，但对象已被释放』的指针。与野指针（未初始化）不同，悬空指针曾有效。"
        },
        {
            question: "在 C 语言中 `int *p = malloc(4);` 是否需要把 void* 强转为 int*？",
            options: ["不需要，void* 可自动转换为任意对象指针", "必须强转否则编译失败", "只有 C++ 中不需要", "必须强转且用 (int*)malloc"],
            correct: 0, difficulty: 2,
            explanation: "C 中 void* 可以隐式转换为任何对象指针类型，所以无需强转。这是 C 与 C++ 的重要区别（C++ 必须强转）。"
        },
        {
            question: "在函数内定义一个大数组 `int a[1000000];`，最可能发生？",
            options: ["栈溢出（默认栈通常只有几 MB）", "分配在堆上", "正常运行", "编译错误"],
            correct: 0, difficulty: 3,
            explanation: "局部大数组在栈上分配，栈空间有限（常见默认 1~8MB），百万级 int 会耗尽栈导致溢出。应改用 malloc 或 static。"
        },
        {
            question: "`int *p = malloc(n);` 想分配 n 个 int 时写错成 `malloc(n)`（漏写 `* sizeof(int)`），后果是？",
            options: ["分配的字节不足，后续写入越界", "一切正常", "返回值溢出", "编译错误"],
            correct: 0, difficulty: 3,
            explanation: "malloc 的参数是字节数。写 `malloc(n)` 只分配 n 字节，而 n 个 int 需要 n*sizeof(int) 字节，会缓冲区越界。"
        },
        {
            question: "长时间运行的程序反复 malloc 而不 free，最终影响是？",
            options: ["可用内存逐渐减少，最终可能分配失败", "立即崩溃", "无任何影响", "程序变快"],
            correct: 0, difficulty: 1,
            explanation: "内存泄漏导致进程占用的内存只增不减，长期运行（如服务器、嵌入式）会最终耗尽内存。"
        },
        {
            question: "对一块并非 malloc 获得的内存（如栈变量地址）调用 free()？",
            options: ["未定义行为", "安全", "被忽略", "编译错误"],
            correct: 0, difficulty: 3,
            explanation: "free 只能释放 malloc/calloc/realloc 等返回的堆内存。释放栈变量、静态区或非堆指针是未定义行为，通常崩溃。"
        },
        {
            question: "realloc 可能移动内存块，移动之后原来的指针 p？",
            options: ["失效，不能再使用，也不能 free", "仍然有效", "会自动更新为新地址", "必须手动 free"],
            correct: 0, difficulty: 3,
            explanation: "realloc 可能把内存搬到新位置并释放旧块。成功后旧指针 p 已失效，必须使用返回值，且不要再 free(p)。"
        },
        {
            question: "动态创建 n 个 int 的数组，正确写法是？",
            options: ["`int *p = malloc(n * sizeof(int));`", "`int *p = malloc(n);`", "`int *p = calloc(n);`", "`int *p = malloc(sizeof(n));`"],
            correct: 0, difficulty: 1,
            explanation: "malloc 需要总字节数，即元素个数 × 每个元素字节数。应写 `n * sizeof(int)` 而不是 n。"
        },
        {
            question: "未包含 <stdlib.h> 就直接调用 malloc（在 C89/C90 环境），会发生？",
            options: ["隐式声明返回 int，64 位下指针被截断，风险极大", "正常工作", "编译错误", "链接错误"],
            correct: 0, difficulty: 3,
            explanation: "C89 允许隐式声明：编译器假定 malloc 返回 int。在 64 位平台指针 8 字节而 int 4 字节，返回值被截断，导致未定义行为。"
        },
        {
            question: "频繁申请和释放大小不一的小内存块，会导致？",
            options: ["内存碎片（free 块分散，大块分配困难）", "栈溢出", "死循环", "数据错乱"],
            correct: 0, difficulty: 1,
            explanation: "反复分配释放不同大小的块会使堆中留下许多小空闲块，导致外部碎片，后续大块分配可能失败。"
        },
        {
            question: "`free(p); p = NULL;` 这样双重保护的价值在于？",
            options: ["避免对同一地址二次 free 导致的未定义行为", "能立即释放物理内存", "提高执行速度", "是编译器的要求"],
            correct: 0, difficulty: 2,
            explanation: "置 NULL 后，即使代码路径重复执行 free(p)，free(NULL) 也是合法的空操作，从而避免 double free。"
        },
        {
            question: "`malloc(0)` 的行为是？",
            options: ["实现定义：可能返回空指针，也可能返回一个可被 free 的非空指针", "必定返回 NULL", "必定崩溃", "编译错误"],
            correct: 0, difficulty: 3,
            explanation: "C 标准规定 malloc(0) 行为是实现定义的。关键是：若返回非 NULL，该指针不能解引用但必须用 free 释放。"
        }
    ]
};
