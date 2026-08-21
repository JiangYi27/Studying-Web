/* ============================================================
 * 新增题库数据（第 12-14 章）— 参考谭浩强《C语言程序设计》
 * 每章 20 道，重点覆盖易混易错点
 * 难度: 1=基础 2=中等 3=困难
 * ============================================================ */
'use strict';

module.exports = {
    '12': [
        {
            question: "有符号负整数右移一位，常见编译器（如 GCC）的行为是？",
            options: ["算术右移：补符号位（相当于除以 2 向负无穷取整）", "逻辑右移：补 0", "未定义行为", "编译错误"],
            correct: 0, difficulty: 3,
            explanation: "对有符号负数的右移，C 标准规定为实现定义。主流编译器采用算术右移：高位补符号位，-8>>1 = -4，-9>>1 = -5（向负无穷舍入）。"
        },
        {
            question: "要判断一个数 x 是否为 2 的幂，常用技巧是？",
            options: ["`(x & (x - 1)) == 0`（且 x 不为 0）", "`x % 2 == 0`", "`x / 2 == 1`", "`x & 1 == 1`"],
            correct: 0, difficulty: 3,
            explanation: "2 的幂的二进制只有一个 1 位。x-1 会把该 1 位及其后全变 1，与 x 相与为 0。需额外排除 x==0 的情况。"
        },
        {
            question: "`a ^ a` 的结果是？",
            options: ["0", "1", "a", "2a"],
            correct: 0, difficulty: 1,
            explanation: "任何数与自身异或，每一位相同，异或结果为 0。利用 `a^b^b = a` 可实现简单加密/交换。"
        },
        {
            question: "`~0`（按位取反）在无符号类型下等于？",
            options: ["该类型的最大值（所有位为 1）", "0", "1", "负数"],
            correct: 0, difficulty: 2,
            explanation: "按位取反把所有位变 1。对 unsigned 类型这就是其最大值，对有符号补码类型则解释为 -1。"
        },
        {
            question: "判断奇偶用 `x & 1`，对于负数 x，`x % 2` 可能为 -1 而 `x & 1` 为 1，下列说法正确的是？",
            options: ["`x % 2` 可能为 -1（符号与被除数相同），`x & 1` 只判断最低位", "两者结果永远相同", "`x & 1` 用于负数会出错", "`x % 2` 永远正确"],
            correct: 0, difficulty: 3,
            explanation: "C99 规定取模结果符号与被除数一致，-3%2 = -1。用 `x & 1` 只看最低位，-3 & 1 = 1，能正确判断奇数。两者判断奇偶的语义不同。"
        },
        {
            question: "用位运算实现乘以 2 的 n 次幂，使用？",
            options: ["`x << n`", "`x >> n`", "`x ^ n`", "`x & n`"],
            correct: 0, difficulty: 1,
            explanation: "左移 n 位相当于乘以 2^n（对无溢出/无符号数）。`x << 2` 等价于 `x * 4`。"
        },
        {
            question: "可变参数函数中，无法确定参数个数的常见解决方法是？",
            options: ["用一个参数（如 count 或格式串）显式说明个数", "靠猜", "靠随机", "编译器自动推断"],
            correct: 0, difficulty: 2,
            explanation: "变参没有自动计数，必须由第一个固定参数（如 printf 的格式串、或显式 count）给出个数/类型信息，否则 va_arg 无法正确推进。"
        },
        {
            question: "va_arg 读取参数时若与传入的实际类型不符，结果是？",
            options: ["未定义行为（可能读到垃圾值或崩溃）", "自动转换", "编译器报错", "返回 0"],
            correct: 0, difficulty: 3,
            explanation: "va_arg 完全依赖程序员指定的类型去解释内存，类型不符是未定义行为。且 char/short 会提升为 int、float 提升为 double，必须按提升后的类型读取。"
        },
        {
            question: "setjmp 与 longjmp 的典型用途是？",
            options: ["在深层嵌套出错时直接跳回起点，模拟异常/错误恢复", "普通函数调用", "优化循环", "处理字符串"],
            correct: 0, difficulty: 2,
            explanation: "longjmp 可跳过多层函数调用直接回到之前 setjmp 保存的环境，常用于嵌套深度大的错误处理。但会跳过栈上资源的清理，需小心。"
        },
        {
            question: "longjmp 之后，哪些变量应声明为 volatile 以免取值未定义？",
            options: ["可能被 longjmp 跳过的栈上的非 volatile 自动变量", "全局变量", "static 变量", "堆变量"],
            correct: 0, difficulty: 3,
            explanation: "longjmp 越过 setjmp 所在函数时，该函数的自动变量在 setjmp 后的变化未定义，除非声明为 volatile。C 标准建议依赖非 volatile 自动变量值的代码慎用 longjmp。"
        },
        {
            question: "内联汇编通常用于？",
            options: ["性能关键路径、直接操作硬件指令", "替代所有 C 代码", "编译提速", "代码混淆"],
            correct: 0, difficulty: 2,
            explanation: "内联汇编允许在 C 中嵌入特定 CPU 指令，用于高性能计算、内核驱动、原子操作等场景。但可移植性差、易错。"
        },
        {
            question: "C11 提供的原子操作头文件是？",
            options: ["<stdatomic.h>", "<thread.h>", "<atomic.h>", "<stdint.h>"],
            correct: 0, difficulty: 3,
            explanation: "C11 原子操作 API 在 <stdatomic.h>（定义 atomic_int、atomic_store、atomic_fetch_add 等）。<atomic.h> 是 POSIX/旧平台头文件。"
        },
        {
            question: "用位掩码测试某一位是否被置位，正确的表达式是？",
            options: ["`(x & mask) != 0`", "`x | mask`", "`x & mask == 1`", "`x ^ mask`"],
            correct: 0, difficulty: 3,
            explanation: "`x & mask` 提取对应位，结果非 0 即该位为 1。注意 `x & mask == 1` 会因优先级先比较 `mask == 1` 再按位与，是错误写法。"
        },
        {
            question: "用位运算快速清零某一位（mask 中该位为 1），使用？",
            options: ["`x &= ~mask`", "`x |= mask`", "`x ^= mask`", "`x &= mask`"],
            correct: 0, difficulty: 2,
            explanation: "`~mask` 把要清的位变 0，其余位变 1，与 x 相与即可清零指定的一位而保持其他位不变。"
        },
        {
            question: "`_Generic` 关键字（C11）的作用是？",
            options: ["根据参数类型选择不同表达式（编译期类型分派）", "泛型内存分配", "模板函数", "类型转换"],
            correct: 0, difficulty: 3,
            explanation: "`_Generic` 根据第一个表达式的类型，在编译期选择一个匹配的表达式，是 C 实现『重载』的一种方式。"
        },
        {
            question: "可变参数宏中如何转发到 printf 等函数？",
            options: ["用 `__VA_ARGS__` 原样传给 printf，如 `#define LOG(...) printf(__VA_ARGS__)`", "无法转发", "只能转发单个参数", "需用 va_list"],
            correct: 0, difficulty: 2,
            explanation: "变参宏用 `__VA_ARGS__` 直接把可变参数展开到调用中，即可转发给 printf 等函数。"
        },
        {
            question: "`char x = 0x80;` 若 char 有符号，那么 `x >> 3` 的结果取决于？",
            options: ["实现定义：可能是算术右移（-16）或逻辑右移（16）", "一定是 16", "一定是 -16", "编译错误"],
            correct: 0, difficulty: 3,
            explanation: "x 为 -128，右移负值是实现定义行为。算术右移补 1 得 -16，逻辑右移补 0 得 16。可移植代码应避免对有符号负数做右移。"
        },
        {
            question: "longjmp 必须在调用 setjmp 的哪个范围内调用才安全？",
            options: ["必须在 setjmp 所在的函数仍存活（未返回）时调用", "任意位置都可以", "只能在 setjmp 的同一函数内", "只能在 main 中"],
            correct: 0, difficulty: 3,
            explanation: "setjmp 保存的环境在其所在函数返回后就失效，此时 longjmp 是未定义行为。安全用法是让 setjmp 函数保持活跃（如保持栈帧）。"
        },
        {
            question: "`a ^= b; b ^= a; a ^= b;` 交换 a、b 的前提条件是？",
            options: ["a 和 b 必须指向不同对象（若同一对象则会被清零）", "任意", "a、b 必须为浮点", "a、b 必须非 0"],
            correct: 0, difficulty: 3,
            explanation: "若 a、b 是同一个变量，`a^=a` 先把它清零，交换失败。这个技巧可读性差，实际不如用临时变量。"
        },
        {
            question: "可变参数函数末尾缺少 va_end() 会？",
            options: ["未定义行为（某些平台会破坏栈），必须配对调用", "被编译器忽略", "自动调用", "仅影响速度"],
            correct: 0, difficulty: 2,
            explanation: "va_start/va_end 必须配对。在部分 ABI（如 x86-64）上 va_start 会分配存储，缺 va_end 是未定义行为，可能引发问题。"
        }
    ],

    '13': [
        {
            question: "插入排序平均时间复杂度是？",
            options: ["O(n^2)", "O(n)", "O(log n)", "O(n log n)"],
            correct: 0, difficulty: 1,
            explanation: "插入排序平均和最坏都是 O(n^2)；最好的情况（已有序）是 O(n)。适合小规模数据。"
        },
        {
            question: "对一个已排序数组查找元素，最快的方法是？",
            options: ["二分查找 O(log n)", "顺序查找 O(n)", "哈希 O(log n)", "冒泡查找"],
            correct: 0, difficulty: 1,
            explanation: "已排序数组用二分查找，每次折半，时间复杂度 O(log n)。顺序查找是 O(n)。"
        },
        {
            question: "链表相比数组的优势是？",
            options: ["插入/删除不需要搬移元素，复杂度 O(1)（给定位置）", "随机访问快", "内存连续", "缓存友好"],
            correct: 0, difficulty: 2,
            explanation: "链表插入/删除只需修改指针，数组则需要移动后续元素（O(n)）。但链表不支持 O(1) 随机访问，且缓存不友好。"
        },
        {
            question: "单链表删除节点（给定前驱节点 pre）需要？",
            options: ["把 pre->next 指向被删节点的 next，再 free 被删节点", "只需 free 被删节点", "需要遍历全表", "只需改被删节点的值"],
            correct: 0, difficulty: 2,
            explanation: "删除节点必须修改其前驱的 next 指针绕过它。如果只给了要删的节点而没有前驱，单链表还需从头遍历找前驱。"
        },
        {
            question: "递归计算斐波那契 fib(40) 非常慢，原因是？",
            options: ["存在大量重复子问题计算，复杂度约 O(2^n)", "整数溢出", "栈不够用", "编译器未优化"],
            correct: 0, difficulty: 3,
            explanation: "朴素的 fib 递归会重复计算同一个子问题（如 fib(38) 被算多次），指数级增长。用迭代或记忆化可降到 O(n)。"
        },
        {
            question: "栈（stack）适合用来实现？",
            options: ["函数调用、表达式求值、括号匹配", "公平排队", "作业调度", "广度优先遍历"],
            correct: 0, difficulty: 1,
            explanation: "栈的 LIFO 特性天然匹配函数调用栈、表达式求值、括号匹配、DFS 等。队列才是 FIFO。"
        },
        {
            question: "广度优先搜索（BFS）使用什么数据结构？",
            options: ["队列", "栈", "数组", "链表"],
            correct: 0, difficulty: 2,
            explanation: "BFS 按层扩展，需要 FIFO 队列存储待访问节点。DFS 用栈（或递归）。"
        },
        {
            question: "二叉搜索树中序遍历的结果是？",
            options: ["升序排列", "降序排列", "随机顺序", "先序遍历"],
            correct: 0, difficulty: 1,
            explanation: "BST 的左子树都小于根、右子树都大于根，中序（左-根-右）遍历得到升序序列。"
        },
        {
            question: "快速排序最坏情况下（如已排序输入 + 固定取首元素为基准）时间复杂度是？",
            options: ["O(n^2)", "O(n log n)", "O(n)", "O(log n)"],
            correct: 0, difficulty: 3,
            explanation: "快排平均 O(n log n)，但基准选取不好时（如有序数组取首元素）退化为 O(n^2)。随机化基准或三数取中可缓解。"
        },
        {
            question: "栈的后进先出（LIFO）对应哪种场景？",
            options: ["浏览器后退、撤销操作", "打印队列", "银行排队", "任务调度"],
            correct: 0, difficulty: 1,
            explanation: "浏览器后退、编辑器撤销都是『最近的操作最先处理』，正是 LIFO 语义，用栈实现。"
        },
        {
            question: "对链表进行顺序访问第 k 个元素，时间复杂度是？",
            options: ["O(k)", "O(1)", "O(log k)", "O(n^2)"],
            correct: 0, difficulty: 2,
            explanation: "链表无法按下标直接定位，必须从头遍历 k 步，因此 O(k)。这是链表相对数组的劣势。"
        },
        {
            question: "哈希表解决冲突的一种方法是？",
            options: ["链地址法（链表/桶）和开放寻址法", "二分法", "排序法", "暴力遍历"],
            correct: 0, difficulty: 2,
            explanation: "常见冲突解决：链地址法（同一槽位串链表）和开放寻址法（线性探测、二次探测等）。"
        },
        {
            question: "判断一个单链表是否有环，常用？",
            options: ["快慢指针（Floyd 判圈）", "二分查找", "哈希排序", "归并"],
            correct: 0, difficulty: 2,
            explanation: "快指针每次走两步、慢指针走一步，若有环两者终会相遇，空间 O(1)。"
        },
        {
            question: "归并排序的主要缺点是？",
            options: ["需要额外 O(n) 的辅助空间", "不稳定", "无法处理大数据", "复杂度是 O(n^2)"],
            correct: 0, difficulty: 2,
            explanation: "归并排序稳定、O(n log n)，但合并时需要与原数组等大的辅助数组，空间 O(n)。"
        },
        {
            question: "在 C 中用数组实现循环队列，判断队空与队满需要？",
            options: ["牺牲一个存储单元，或用 size 字段/标志位区分", "靠数组下标", "无法区分", "靠 malloc"],
            correct: 0, difficulty: 3,
            explanation: "队空时 front==rear，队满若也 front==rear 就无法区分。常用方法：留一个空位（front 指向空位）、记录元素个数、或用标志位。"
        },
        {
            question: "快速排序是不稳定排序，意味着？",
            options: ["相等元素的相对顺序可能被打乱", "结果一定错误", "速度一定慢", "占用空间一定大"],
            correct: 0, difficulty: 2,
            explanation: "稳定排序保持相等元素的原始相对次序，不稳定则可能改变。快排、堆排、选择排序不稳定；归并、冒泡、插入稳定。"
        },
        {
            question: "深度优先遍历（DFS）可以用递归实现，因为递归本质上依赖？",
            options: ["栈", "队列", "堆", "链表"],
            correct: 0, difficulty: 1,
            explanation: "递归调用会压入函数调用栈，DFS 的『回溯』正是栈的特性。显式实现 DFS 也常用栈。"
        },
        {
            question: "对一个几乎有序的数组排序，哪种算法最合适？",
            options: ["插入排序（几乎有序时接近 O(n)）", "快排最坏情况", "堆排序", "选择排序"],
            correct: 0, difficulty: 3,
            explanation: "插入排序对近有序数据性能极佳（每元素基本只需一次比较）。而快排固定基准在有序输入下反而退化。"
        },
        {
            question: "二分查找对数据结构的要求是？",
            options: ["必须是有序的且支持 O(1) 随机访问（如数组）", "链表即可", "必须是树", "无序即可"],
            correct: 0, difficulty: 2,
            explanation: "二分查找需要随机访问中间元素，数组满足 O(1) 下标访问；链表无法高效跳转，不适合二分。"
        },
        {
            question: "把递归改写成循环（尾递归优化），主要解决？",
            options: ["栈空间开销和调用开销", "代码可读性", "编译速度", "内存碎片"],
            correct: 0, difficulty: 2,
            explanation: "迭代改写避免了每层递归的栈帧开销，防止深递归栈溢出，也减少了函数调用开销。"
        }
    ],

    '14': [
        {
            question: "gcc 把源码编译成目标文件用 `-c`，链接多个目标文件生成可执行文件用？",
            options: ["`gcc a.o b.o -o prog`", "`gcc -c a.o b.o`", "`gcc -E a.o b.o`", "`ar a.o b.o`"],
            correct: 0, difficulty: 1,
            explanation: "-c 只编译不链接生成 .o；链接时直接给出一堆 .o 让 gcc 调用链接器，-o 指定输出名。"
        },
        {
            question: "Makefile 中，目标文件依赖的源文件更新后，make 会？",
            options: ["只重新编译依赖发生变化的规则", "重新编译所有文件", "什么都不做", "报错"],
            correct: 0, difficulty: 1,
            explanation: "make 依据文件时间戳判断：只有当依赖比目标新时才执行该规则的命令，实现增量编译。"
        },
        {
            question: "GDB 中 `next` 与 `step` 的区别是？",
            options: ["next 不进入被调函数，step 会进入", "next 更快", "两者完全相同", "step 跳过函数"],
            correct: 0, difficulty: 1,
            explanation: "next 单步执行且不进入函数调用；step 会跟进函数内部。调试到关键函数时常用 step。"
        },
        {
            question: "程序崩溃后生成 core dump，用 GDB 分析的方式是？",
            options: ["`gdb ./prog core` 后使用 bt 查看调用栈", "无法分析", "重新运行即可", "删除 core 文件"],
            correct: 0, difficulty: 2,
            explanation: "`gdb 可执行文件 core文件` 进入调试，`bt`（backtrace）打印崩溃时的调用栈，是定位崩溃的利器。"
        },
        {
            question: "链接时 `undefined reference` 与 `multiple definition` 的区别？",
            options: ["前者是符号没有定义（缺文件/库），后者是符号被定义多次（重复）", "没有区别", "都是编译错误", "都发生在编译期"],
            correct: 0, difficulty: 3,
            explanation: "undefined reference 表示找不到符号定义（漏了库/目标文件）；multiple definition 表示同名符号出现在多个编译单元（重复定义）。都发生在链接期。"
        },
        {
            question: "`static` 在文件作用域修饰函数/全局变量，效果是？",
            options: ["限制其链接性为内部（仅本文件可见），避免冲突", "使其只读", "提高性能", "使其自动内联"],
            correct: 0, difficulty: 2,
            explanation: "文件作用域的 static 使符号只在当前编译单元可见（内部链接），不同文件可用同名函数/变量而不冲突。"
        },
        {
            question: "断言 `assert(expr)` 在什么条件下生效？",
            options: ["未定义 NDEBUG 时；expr 为假则终止程序并报告位置", "总是生效", "从不生效", "仅在 release 生效"],
            correct: 0, difficulty: 2,
            explanation: "assert 在 <assert.h>。若定义了 NDEBUG，assert 被替换为空语句（失效）。expr 为假时打印文件、行号并调用 abort。"
        },
        {
            question: "volatile 关键字告诉编译器什么？",
            options: ["该对象可能被程序外部修改，禁止优化其访问", "变量只读", "变量需要更快的访问", "变量是全局的"],
            correct: 0, difficulty: 3,
            explanation: "volatile 防止编译器把对该变量的访问优化掉或缓存到寄存器，常用于硬件寄存器、信号处理共享变量。它不解决线程同步问题。"
        },
        {
            question: "内存在同一作用域内既能被静态数组用又可能被越界访问，检测这类错误的最佳工具是？",
            options: ["Valgrind 或 ASan（AddressSanitizer）", "gcc -c", "gdb print", "make"],
            correct: 0, difficulty: 2,
            explanation: "Valgrind 和 AddressSanitizer（编译时 -fsanitize=address）专门检测越界访问、释放后使用等内存错误。"
        },
        {
            question: "头文件包含 order 敏感（A 依赖 B 的 typedef 却先包含 A）会导致？",
            options: ["编译错误，应在依赖方先包含被依赖的头文件", "运行错误", "链接错误", "没有影响"],
            correct: 0, difficulty: 2,
            explanation: "头文件按顺序展开，若先展开的代码用到尚未声明的类型/函数就会编译失败。设计头文件应自包含（自己 include 依赖）。"
        },
        {
            question: "用 `gcc -DDEBUG` 的 `-D` 选项作用是？",
            options: ["在编译命令行定义宏 DEBUG（等价于文件内 #define DEBUG）", "开启调试模式", "删除宏", "指定调试信息"],
            correct: 0, difficulty: 2,
            explanation: "-Dname 在预处理前定义宏，相当于 #define name。常配合 #ifdef DEBUG 启用调试代码。"
        },
        {
            question: "将一个 .c 文件编译为可执行文件的完整命令是？",
            options: ["`gcc -Wall main.c -o prog`", "`gcc -c main.c`", "`gcc -E main.c`", "`gcc -S main.c`"],
            correct: 0, difficulty: 1,
            explanation: "不带 -c 时 gcc 一步完成编译+链接。加 -Wall 开启警告。`-o prog` 指定输出文件名。"
        },
        {
            question: "Makefile 中把目标声明为 `.PHONY`，表明？",
            options: ["该目标不是文件，即使没有同名文件也总是执行其命令", "该目标不能被执行", "该目标是隐藏文件", "该目标只编译一次"],
            correct: 0, difficulty: 2,
            explanation: "像 clean 这类目标不对应实际文件，若恰好存在名为 clean 的文件，make 会误判无需执行。`.PHONY: clean` 强制总是执行。"
        },
        {
            question: "编译链接共享库时通常需要？",
            options: ["编译加 `-fPIC`、链接加 `-shared`", "无需特殊处理", "只用 ar", "使用 -c"],
            correct: 0, difficulty: 3,
            explanation: "共享库需位置无关代码：`gcc -fPIC -c foo.c` 再 `gcc -shared -o libfoo.so foo.o`。静态库则用 ar。"
        },
        {
            question: "GDB 查看变量 x 的值用命令？",
            options: ["`print x`（或简写 p x）", "`list x`", "`break x`", "`run x`"],
            correct: 0, difficulty: 1,
            explanation: "print/p 显示变量或表达式当前值。break 是断点，list 看源码，run 运行程序。"
        },
        {
            question: "防御式编程中，对输入的长度做限制属于？",
            options: ["输入验证（避免缓冲区溢出等）", "日志记录", "单元测试", "代码注释"],
            correct: 0, difficulty: 1,
            explanation: "限制输入长度、校验范围是输入验证的一部分，是防止缓冲区溢出等漏洞的第一道防线。"
        },
        {
            question: "`#include` 引号（\"...\"）与尖括号（<...>）在查找顺序上的区别？",
            options: ["引号先查当前源文件目录再查系统路径，尖括号只查系统路径", "完全相同", "尖括号先查当前目录", "引号只查系统路径"],
            correct: 0, difficulty: 2,
            explanation: "\"\" 优先在当前源文件目录查找（通常用于项目内头文件），找不到再查 include 路径；<> 直接从系统/标准 include 路径查找。"
        },
        {
            question: "gdb 中查看某个函数在当前行的源码，使用？",
            options: ["`list`（或 l）", "`print`", "`info break`", "`next`"],
            correct: 0, difficulty: 2,
            explanation: "list/l 显示当前执行点附近的源码。print 看值，next 单步。"
        },
        {
            question: "优化导致 bug 难以定位时（如 `-O3` 下行为不同），建议？",
            options: ["用 `-O0` 或 `-g` 编译以保留调试信息并关闭优化来定位", "增加随机代码", "换成 C++", "降低机器配置"],
            correct: 0, difficulty: 2,
            explanation: "`-g` 产生调试符号，`-O0` 关闭优化。优化可能改变执行细节（如寄存器分配），先关优化定位逻辑问题，再排查优化相关 bug。"
        },
        {
            question: "代码中大量使用未检查的 malloc 返回值，最坏结果是？",
            options: ["空指针解引用导致崩溃或被利用", "自动重试", "分配失败被忽略", "编译错误"],
            correct: 0, difficulty: 2,
            explanation: "不检查 malloc 返回值，失败时 p=NULL，随后解引用即崩溃。检查返回值是防御式编程的基本要求。"
        }
    ]
};
