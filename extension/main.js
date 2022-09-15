/// <reference path="../vscode.d.ts" />
let vscode = require('vscode');

const HINT_DATA_FILES = {
	WORD: `${__dirname}/../hint_data/words.json`
};

const QUOTES = '\'\"';

const DOCUMENT_SELECTOR = ['markdown', 'latex'];

const HOVER_INFO_WORD = '**Word**';

let wordCompletionItems = [],
	wordItems = [];

function getTextBeforeCursor(document, position) {
	var start = new vscode.Position(position.line, 0);
	var range = new vscode.Range(start, position);
	return document.getText(range);
}

function getTextAroundCursor(document, position) {
	let lineText = document.lineAt(position).text,
		pos = position.character;
	let beforeText = lineText.slice(0, pos),
		afterText = lineText.slice(pos);
	beforeText = (beforeText.match(/\w*$/) || [''])[0];
	afterText = (afterText.match(/^\w*/) || [''])[0];
	return beforeText + afterText;
}

function isCursorInTheString(textBeforeCursor) {
	// TODO 考虑上一行行末是否有 \ 字符, 如果有的话就还要检测上一行
	if (textBeforeCursor.indexOf(QUOTES[0]) == -1 ||
		textBeforeCursor.indexOf(QUOTES[1]) == -1) return false;

	let len = textBeforeCursor.length, i = -1, inStr = false, char, qType;
	while (++i < len) {
		char = textBeforeCursor[i];
		if (char == '\\')
			i++;
		else if ((qType = QUOTES.indexOf(char)) >= 0)
			inStr = inStr == QUOTES[qType] ? false : QUOTES[qType];
	}
	return inStr;
}

function getFuncAndParamsInfoAroundCursor(textBeforeCursor) {
	if (textBeforeCursor.indexOf('(') == -1) return false;
	return textBeforeCursor.match(/.+\b(\w+)\((.*?)$/);
}

function loadHintData() {
	wordCompletionItems = [];
	wordItems = require(HINT_DATA_FILES.WORD);
	// window.alert(len(wordItems));
	// console.log(wordItems.length);
	wordItems.forEach(word => {
		let item = new vscode.CompletionItem(word.name, vscode.CompletionItemKind.Function);
		item.documentation = word.desc;
		item.detail = word.set;
		item.usage = word.usage;
		item._filter = word.name;
		wordCompletionItems.push(item);
	});
}

function searchHintCompletionItems(keyword) {
	// console.log(keyword)
	return wordCompletionItems.filter(it => it._filter.startsWith(keyword));
}

function findHintItem(wordname) {
	let item = wordItems.filter(it => it.name == wordname);
	// item.length || (item = varItems.filter(it => it.name == wordname));
	return item.length ? item[0] : null;
}

function findHintFunctionItem(wordname) {
	let item = wordItems.filter(it => it.name == wordname);
	return item.length ? item[0] : null;
}

function activate(context) {
	var subscriptions = context.subscriptions;
	loadHintData();

	subscriptions.push(
		vscode.languages.registerCompletionItemProvider(DOCUMENT_SELECTOR, {
			provideCompletionItems: (document, position/*, token*/) => {
				let beforeText = getTextBeforeCursor(document, position);
				// console.log(beforeText)
				// beforeText = beforeText.toLowerCase()
				if (isCursorInTheString(beforeText)) return [];
				let keyword = (beforeText.match(/^.*?\b(\w*)$/) || ['', ''])[1];
				// console.log(keyword)
				if (!keyword) return wordCompletionItems;
				// keyword = beforeText;
				let items = searchHintCompletionItems(keyword);
				if (items.length == 0)  // 大写开头的单词不能不全，转成小写搜索一遍
					items = searchHintCompletionItems(keyword.toLowerCase());
				return items;
			},
			resolveCompletionItem: (item/*, token*/) => item
		}
		));
}

function deactivate() {

}

exports.activate = activate;
exports.deactivate = deactivate;