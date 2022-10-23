// 將網址設置常數，以防未來須修改
const BASE_URL = "https://movie-list.alphacamp.io";
const INDEX_URL = BASE_URL + "/api/v1/movies/";
const POSTER_URL = BASE_URL + "/posters/";

//一頁顯示幾筆資料
const MOVIES_PER_PAGE = 12;

//放電影清單的所有電影
const movies = [];
//存放搜尋完的結果
//從searchForm監聽器拿出來的
let filteredMovies = [];

const dataPanel = document.querySelector("#data-panel");
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const paginator = document.querySelector("#paginator");

function renderMovieList(data) {
  let rawHTML = "";

  data.forEach((item) => {
    //我們需要title、image
    // console.log(item)

    rawHTML += `<div class="col-sm-3">
        <div class="mb-2">
          <div class="card">
            <img
              src="${POSTER_URL + item.image}"
              class="card-img-top" alt="Movie Poster">
            <div class="card-body">
              <h5 class="card-title">${item.title}</h5>
            </div>
            <!-- Footer -->
            <div class="card-footer">
              <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal"
                data-bs-target="#movie-modal" data-id="${item.id}">More</button>
              <button class="btn btn-info btn-add-favorite" data-id="${item.id
      }">+</button>
            </div>
          </div>
        </div>
      </div>`;
  });

  dataPanel.innerHTML = rawHTML;
}

//產生分頁(li)
//amount:資料數量
function renderPaginator(amount) {
  //預計會有幾頁
  //Math.ceil():無條件進位
  const numberOfPages = Math.ceil(amount / MOVIES_PER_PAGE);
  let rawHTML = "";

  for (let page = 1; page <= numberOfPages; page++) {
    rawHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${page}">${page}</a></li>`;
  }

  paginator.innerHTML = rawHTML;
}

//當第一頁時，會顯示第一頁應該有的資料，第二頁，會顯示第二頁該給的資料
function getMoviesByPage(page) {
  //沒有搜尋，會有80部電影的分頁，有搜尋，會有搜尋的分頁
  //若filteredMovies裡有資料，只顯示filteredMovies裡的資料就好，若filteredMovies沒有資料，那就顯示movies的資料
  const data = filteredMovies.length ? filteredMovies : movies;

  //slice(star切割的起點,end切割的終點):切割陣列的一部份，回傳回來
  //page 1 -> movies 0~11
  //page 2 -> movies 12~23

  const startIndex = (page - 1) * MOVIES_PER_PAGE;

  return data.slice(startIndex, startIndex + MOVIES_PER_PAGE);
}

function showMovieModal(id) {
  const modalTitle = document.querySelector("#movie-modal-title");
  const modalImage = document.querySelector("#movie-modal-image");
  const modalDate = document.querySelector("#movie-modal-date");
  const modalDescription = document.querySelector("#movie-modal-description");

  axios.get(INDEX_URL + id).then((response) => {
    //response.data.results
    const data = response.data.results;
    modalTitle.innerText = data.title;
    modalDate.innerText = "Release date：" + data.release_date;
    modalDescription.innerText = data.description;
    modalImage.innerHTML = `<img src="${POSTER_URL + data.image
      }" alt="movie-poster" class="img-fluid">`;
  });
}

function addToFavorite(id) {
  //看按"+"能不能正常show出id
  // console.log(id);

  //將localStorage裡的東西取出來，localStorage會有兩種情況，裡面已經有喜歡的電影，或沒有
  //因為localStorage只能存'字串'，所以需要加JSON.parse()，把字串轉換為javascript的資料'物件'或'陣列'(object or array)
  const list = JSON.parse(localStorage.getItem("favoriteMovies")) || [];

  //JSON.stringify():把javascript的資料變成JSON字串
  // const jsonString = JSON.stringify(list);
  // console.log("json string:", jsonString);
  // console.log("json object:", JSON.parse(jsonString));

  // //當電影的Id會等於addToFavorite 的id時

  // function isMovieIdMatched(movie) {
  //   return movie.id === id; //movie 的 id === addToFavorite 的 id
  // }

  // //把movies裡的所有movie帶進去比對，如果movie 的 id === addToFavorite 的 id，就會把那部電影帶出來
  // 在找到第一個符合條件的 item 後就回停下來回傳該 item
  // const movie = movies.find(isMovieIdMatched);

  //簡化版
  const movie = movies.find((movie) => movie.id === id);
  // console.log(movie);

  //電影有沒有重複加入
  //some():陣列裡有沒有那個元素，有的話給true，沒有給false，並不會把東西帶出來
  if (list.some((movie) => movie.id === id)) {
    return alert("此電影已經在收藏清單中!");
  }

  //把符合條件的電影放到list裡
  list.push(movie);

  // console.log(list);

  localStorage.setItem("favoriteMovies", JSON.stringify(list));
}

dataPanel.addEventListener("click", function onPanelClicked(event) {
  if (event.target.matches(".btn-show-movie")) {
    // console.log(event.target.dataset)

    //dataset裡的值都是字串，需要轉成數字
    showMovieModal(Number(event.target.dataset.id));
  } else if (event.target.matches(".btn-add-favorite")) {
    addToFavorite(Number(event.target.dataset.id));
  }
});

paginator.addEventListener("click", function onPaginatorClicked(event) {
  //如果點擊的target的tagName不是<a></a>的話，不執行函數
  if (event.target.tagName !== "A") return;

  //回傳頁數
  // console.log(event.target.dataset.page);

  const page = Number(event.target.dataset.page);

  renderMovieList(getMoviesByPage(page));
});

searchForm.addEventListener("submit", function onSearchFormSubmitted(event) {
  //請瀏覽器不要做預設的動作，把控制權交給javascript做
  event.preventDefault();
  // console.log(event);
  //確認在search bar輸入文字後按enter，console會出現值
  // console.log(searchInput.value);

  //toLowerCase()：值變小寫，希望搜尋是不分大小寫都可以搜尋到
  //trim()：去頭尾空白
  const keyword = searchInput.value.trim().toLowerCase();

  //如果沒有輸入字
  // if (!keyword.length) {
  //   return alert("Please enter a vaild string!");
  // }

  //搜尋方法一
  // for (const movie of movies) {
  //   //如果搜尋的關鍵字有包含在title裡，就會放進filteredMovies裡
  //   if (movie.title.toLowerCase().includes(keyword)) {
  //     filteredMovies.push(movie);
  //   }
  // }

  //搜尋方法二
  //filter()：像是過濾器，符合的會留下，不符合的會剔除
  //map , filter , reduce 陣列操作三寶
  filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(keyword)
  );

  //輸入亂字會跳alert
  if (filteredMovies.length === 0) {
    return alert("Cannot find movie with keyword：" + keyword);
  }

  //從新渲染分頁
  renderPaginator(filteredMovies.length);
  //從新渲染filteredMovies
  renderMovieList(getMoviesByPage(1));
});

axios
  .get(INDEX_URL)
  .then((response) => {
    // //方法一
    // for(const movie of response.data.results){
    //   movies.push(movie)
    // }

    //方法二
    //...可以消除外層
    movies.push(...response.data.results);
    // console.log(movies)

    // //舉例
    // const numbers = [1,2,3]
    // movies.push(...numbers)
    // movies.push(...[1,2,3])
    // movies.push(1,2,3)

    // //Array(80)
    // console.log(response.data.results)

    renderPaginator(movies.length);
    renderMovieList(getMoviesByPage(1));
  })

  .catch((err) => console.log(err));

//(key , value)
// localStorage.setItem("default_language", "English");
// console.log(localStorage.getItem("default_language"));
// localStorage.removeItem("default_language");

// 存入資料 - localStorage.setItem('key','value')
// 取出資料 - localStorage.getItem('key')
// 移除資料 - localStorage.removeItem('key')
