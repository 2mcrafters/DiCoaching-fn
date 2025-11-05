// let getNextId = (function() {
//     let count = 1000;
//     return () =>  count++; 
// })()


//  console.log(getNextId());
//  console.log(getNextId());
//  console.log(getNextId());
//  console.log(getNextId());
//  console.log(getNextId());
//  console.log(getNextId());
//  console.log(typeof true);
//  const arr = [1,2,3,4,5];
//  console.log(typeof arr); bollean
//  console.log(Array.isArray(arr)); // to check array
// function testType(word) {
// if(typeof word == "boolean"){
// console.log(word+" est Boolean")}
// else if(word === null){ console.log( word +" is null" ) }
// }
// testType(true);
// testType("hello");
// testType(null);
// testType([]);
// testType({});

function typeOfWord (value) {
    let x = Object.prototype.toString.call(value);
    console.log(x.slice(8, -1).toLowerCase());
}
typeOfWord(true);
typeOfWord(123);
typeOfWord(123n);
typeOfWord("hello");
typeOfWord([]);
typeOfWord({});
typeOfWord({});
typeOfWord(/d/);
typeOfWord(null);
typeOfWord(undefined);
